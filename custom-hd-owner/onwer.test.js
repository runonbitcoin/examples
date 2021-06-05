const { DB } = require("./db")
const { Owner } = require("./owner")
const { Script, Tx, Bn, Address } = require('bsv')
const { CommonLock } = require('run-sdk').util
const _ = require('lodash')

async function signTxUsingLocks(owner, locks) {
  const lockingScripts = locks.map((lock) => Script.fromHex(lock.script()))  

  const tx = new Tx()
  tx.addTxOut(new Bn().fromNumber(1000), Address.fromRandom())
  lockingScripts.forEach(lockingScript => {
    tx.addTxIn(
      Buffer.alloc(32).fill(1),
      0,
      lockingScript
    )
  })

  await owner.sign(
    tx.toHex(), 
    lockingScripts.map((lockingScript) => ({ satoshis: 2000, script: lockingScript})), 
    locks
  )
}

describe(Owner, () => {
  let anOwner = null
  const aMnemonic = 'trap note skull stool throw submit behind outer language victory bar pitch'

  beforeEach(() => {
    anOwner = new Owner(aMnemonic, new DB())
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
      const firstLoop = await Promise.all(
        _.range(20).map(async () => (await anOwner.nextOwner()).script())
      )

      const secondLoop = await Promise.all(
        _.range(20).map(async () => (await anOwner.nextOwner()).script())
      )

      _.zip(firstLoop, secondLoop).forEach(([first, second]) => {
        expect(first).toEqual(second)
      })
    })

    test('after sign the first lock produced it enables the 21th lock', async () => {
      const firstLock = await anOwner.nextOwner()

      await signTxUsingLocks(anOwner, [ firstLock ])

      await Promise.all(_.range(19).map(() => anOwner.nextOwner()))

      const twentiFirstOwner = await anOwner.nextOwner()

      expect(firstLock.script()).not.toEqual(twentiFirstOwner.script())
    })

    test('after sign the first lock produced it loops the 22th lock', async () => {
      const firstLock = await anOwner.nextOwner()
      const secondLock = await anOwner.nextOwner()

      await signTxUsingLocks(anOwner, [ firstLock ])

      await Promise.all(_.range(19).map(() => anOwner.nextOwner()))

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
      const newerLocksScripts = await Promise.all(
        _.range(20).map(async () => (await anOwner.nextOwner()).script())
      )

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

      const firstLoop = await Promise.all(
        _.range(20).map(async () => (await anOwner.nextOwner()).script())
      )

      const secondLoop = await Promise.all(
        _.range(20).map(async () => (await anOwner.nextOwner()).script())
      )

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
      const newerLocksScripts = await Promise.all(
        _.range(20).map(async () => (await anOwner.nextOwner()).script())
      )

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
      const newerLocksScripts = await Promise.all(
        _.range(20).map(async () => (await anOwner.nextOwner()).script())
      )

      // Check locks did not repeat
      firstLocks.forEach(lock => {
        expect(newerLocksScripts).not.toContain(lock.script())
      })
    })
  })
})