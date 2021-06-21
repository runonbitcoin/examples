const Run = require('run-sdk')

async function main () {
  class Princess extends Jig {
    send (to) { this.owner = to }
  }

  class Gold extends Jig {
    send (to) { this.owner = to }
  }

  class TxFees extends Jig {
    init(satoshis) { this.satoshis = satoshis }
  }

  class Ransom extends Jig {
    init (tx, owner) { this.tx = tx; this.owner = owner }
  }

  // ------------------------------------------------------------------------
  // Dragon acquires the princess
  // ------------------------------------------------------------------------

  const dragonRun = new Run({ network: 'mock', trust: '*' })

  const princess = new Princess()

  await princess.sync()

  // ------------------------------------------------------------------------
  // Town acquires some gold, and also some bitcoin for fees
  // ------------------------------------------------------------------------

  const townRun = new Run({ network: 'mock', trust: '*' })

  const gold = new Gold()

  const fees = new TxFees(10000)

  await townRun.sync()

  // ------------------------------------------------------------------------
  // Town creates an atomic swap proposal and signs it
  // ------------------------------------------------------------------------

  const swap = new Run.Transaction()

  swap.update(() => gold.send(dragonRun.owner.pubkey))
  swap.update(() => princess.send(townRun.owner.pubkey))
  swap.update(() => fees.destroy())

  const swapTransaction = await swap.export()

  swap.rollback()

  // ------------------------------------------------------------------------
  // Town sends the proposal to the dragon
  // ------------------------------------------------------------------------

  const ransom = new Ransom(swapTransaction, dragonRun.owner.pubkey)

  await ransom.sync()

  // ------------------------------------------------------------------------
  // Dragon reviews the proposal and then accepts it
  // ------------------------------------------------------------------------

  dragonRun.activate()

  const signedSwap = await dragonRun.import(ransom.tx)

  console.log('Number of jigs swapped:', signedSwap.outputs.length)

  await signedSwap.publish()
}

main()
