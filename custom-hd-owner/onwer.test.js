const { DB } = require("./db")
const { Owner } = require("./owner")
const { Script, Tx, Bn, Address } = require('bsv')
const { CommonLock } = require('run-sdk').util
const _ = require('lodash')

async function signTxUsingLocks(owner, locks) {
  const lockingScripts = locks.map((lock) => Script.fromHex(lock.script()))  

  const tx = new Tx()
  tx.addTxOut(new Bn().fromNumber(1000), Address.fromRandom())
  lockingScripts.forEach(_lockingScript => {
    tx.addTxIn(
      Buffer.alloc(32).fill(1),
      0,
      Script.fromAsmString('0 0')
    )
  })

  return owner.sign(
    tx.toHex(), 
    lockingScripts.map((lockingScript) => ({ satoshis: 2000, script: lockingScript.toHex()})), 
    locks
  )
}

async function nextNLocks (owner, n) {
  const locks = []
  for (const _i of _.range(n)) {
    const lock = await owner.nextOwner()
    locks.push(lock)
  }  
  return locks
}

async function next20Locks (owner) {
  return nextNLocks(owner, 20)
}

describe(Owner, () => {
  let anOwner = null
  const aMnemonic = 'trap note skull stool throw submit behind outer language victory bar pitch'

  beforeEach(async () => {
    anOwner = new Owner(aMnemonic, new DB())
    await anOwner.initialize()
  })

  describe('#nextOwner', () => {
    test('it returns a lock', async () => {
      const nextOwner = await anOwner.nextOwner()
      expect(() => Script.fromHex(nextOwner.script())).not.toThrow()
      expect(typeof nextOwner.domain()).toBe('number')
    })

    test('calling it twice returns different locks', async () => {
      const nextOwner = await anOwner.nextOwner()
      const nextNextOwner = await anOwner.nextOwner()

      expect(nextOwner.script()).not.toEqual(nextNextOwner.script())
    })

    test('it loops every 20 calls if no signature was made in the middle', async () => {
      const firstLoop = await next20Locks(anOwner)
      const secondLoop = await next20Locks(anOwner)

      _.zip(firstLoop, secondLoop).forEach(([first, second]) => {
        expect(first).toEqual(second)
      })
    })

    test('after sign the first lock produced it enables the 21th lock', async () => {
      const firstLock = await anOwner.nextOwner()

      await signTxUsingLocks(anOwner, [ firstLock ])

      await nextNLocks(anOwner, 19)

      const twentiFirstOwner = await anOwner.nextOwner()

      expect(firstLock.script()).not.toEqual(twentiFirstOwner.script())
    })

    test('after sign the first lock produced it loops the 22th lock', async () => {
      const firstLock = await anOwner.nextOwner()
      const secondLock = await anOwner.nextOwner()

      await signTxUsingLocks(anOwner, [ firstLock ])

      await nextNLocks(anOwner, 19)

      const twentiSecondLock = await anOwner.nextOwner()

      expect(twentiSecondLock.script()).toEqual(secondLock.script())
    })

    test('after sign using the 10th address the next 20 locks does not repeat with the first 9', async () => {
      // Skip first 9
      const firstLocks = await Promise.all(_.range(9).map(() => anOwner.nextOwner()))

      // Get 10th
      const tenthLock = await anOwner.nextOwner()

      // Sign a tx
      await signTxUsingLocks(anOwner, [ tenthLock ])

      // Get next 20 locks
      const newerLocksScripts = next20Locks(anOwner)

      firstLocks.forEach(lock => {
        expect(newerLocksScripts).not.toContain(lock.script())
      })
      expect(newerLocksScripts).not.toContain(tenthLock.script())
    })

    test('after sign using the 10th lock and then te 1st lock the next 20 locks does not repeat with the first 9', async () => {
      // Skip first 9
      const firstLocks = await Promise.all(_.range(9).map(() => anOwner.nextOwner()))

      // Get 10th
      const tenthLock = await anOwner.nextOwner()

      // Sign a tx using first 10th, then 1st
      await signTxUsingLocks(anOwner, [ tenthLock ])
      await signTxUsingLocks(anOwner, [ firstLocks[0] ])

      // Get next 20 locks
      const newerLocksScripts = await Promise.all(
        _.range(20).map(async () => (await anOwner.nextOwner()).script())
      )

      firstLocks.forEach(lock => {
        expect(newerLocksScripts).not.toContain(lock.script())
      })
      expect(newerLocksScripts).not.toContain(tenthLock.script())
    })

    test('after sign using the 10th it loops from 11th to 31th', async () => {
      // Skip first 9
      const firstLocks = await Promise.all(_.range(9).map(() => anOwner.nextOwner()))

      // Get 10th
      const tenthLock = await anOwner.nextOwner()

      // Sign a tx
      await signTxUsingLocks(anOwner, [ tenthLock ])

      const firstLoop = next20Locks(anOwner)

      const secondLoop = next20Locks(anOwner)

      _.zip(firstLoop, secondLoop).forEach(([first, second]) => {
        expect(first).toEqual(second)
      })
    })

    test('after sign using the 1st and 10th at the same time it then does not produce the same 10 again', async () => {
      // save first 10
      const firstLocks = await Promise.all(_.range(10).map(() => anOwner.nextOwner()))

      // Sign a tx
      await signTxUsingLocks(anOwner, [firstLocks[0], firstLocks[9]])

      // Find next 20 scripts
      const newerLocksScripts = (await next20Locks(anOwner)).map(lock => lock.script())

      // Check locks did not repeat
      firstLocks.forEach(lock => {
        expect(newerLocksScripts).not.toContain(lock.script())
      })
    })

    test('it ignores unknown addresses', async () => {
      // save first 10
      const firstLocks = await Promise.all(_.range(10).map(() => anOwner.nextOwner()))

      // Sign a tx
      await signTxUsingLocks(anOwner, [
        firstLocks[0], 
        firstLocks[9],
        // Arbitrary address
        new CommonLock(Address.fromRandom().toString()
      )])

      // Find next 20 scripts
      const newerLocksScripts = (await next20Locks(anOwner)).map(lock => lock.script())

      // Check locks did not repeat
      firstLocks.forEach(lock => {
        expect(newerLocksScripts).not.toContain(lock.script())
      })
    })
  })

  describe('#sign', () => {
    test('it signs tx using one related lock', async () => {
      const firstLock = await anOwner.nextOwner()
      const signedTxHex = await signTxUsingLocks(anOwner, [ firstLock ])
      const tx = Tx.fromHex(signedTxHex)
      expect(tx.txIns[0].script).not.toEqual(Script.fromAsmString('0 0'))
    })
  })
})