const bsv = require('bsv')
const Run = require('run-sdk')
const { asm } = Run.extra

/**
 * Define a lock
 * 
 * A lock is a special kind of jig owner that is a custom locking script
 * 
 * Below, script is the output script. Domain is how big its unocking script will be in bytes.
 */

class TwoPlusTwoLock {
  script () { return asm('OP_2 OP_2 OP_ADD OP_EQUAL') }
  domain () { return 1 }
}

TwoPlusTwoLock.deps = { asm }

/**
 * Define a key
 * 
 * To update jigs with the above lock, we need to create unlocking scripts.
 * 
 * We can do this by implementing the Owner API below. There are two methods.
 */

class TwoPlusTwoKey {
  async nextOwner () { return new TwoPlusTwoLock() }

  async sign (rawtx, parents, locks) {
    const tx = new bsv.Transaction(rawtx)

    // Sign any TwoPlusTwoLock
    tx.inputs
      .filter((input, n) => locks[n] instanceof TwoPlusTwoLock)
      .forEach(input => input.setScript('OP_4'))
    
    return tx.toString('hex')
  }
}

/**
 * Create a jig assigned to the TwoPlusTwoLock and update it with the TwoPlusTwoKey
 */

async function main () {
  const run = new Run({ network: 'mock', owner: new TwoPlusTwoKey() })

  class Dragon extends Jig { setName(name) { this.name = name } }
  const dragon = new Dragon()
  await dragon.sync()

  dragon.setName('Victoria')
  await dragon.sync()

  console.log('Unlocked the custom lock')
}

main().catch(e => console.error(e))
