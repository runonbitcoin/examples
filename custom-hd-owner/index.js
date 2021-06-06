process.env.NETWORK = 'testnet'
const Run = require('run-sdk')
const { HdOwner } = require('./hd-owner')
const { DB } = require('./db')

class Box extends Run.Jig {
  init (aValue) {
    this.value = aValue
  }

  update (newValue) {
    this.value = newValue
  }
}

const main = async () => {
  const db = new DB()
  const aMnemonic = 'trap note skull stool throw submit behind outer language victory bar pitch'
  const owner = new HdOwner(aMnemonic, db)
  await owner.initialize()
  const run = new Run({ network: 'mock', owner })

  const DeployedBox = run.deploy(Box)

  const box1 = new DeployedBox('gems')
  const box2 = new DeployedBox('gold')

  await run.sync()

  // Both boxes have different owners
  console.log(`box1.owner: ${box1.owner}`)
  console.log(`box2.owner: ${box2.owner}`)

  // yet both can be modified
  box1.update('more gems')
  await box1.sync()
  box2.update('more gold')
  await box2.sync()

  // and now there owners are even different
  console.log(`box1.owner: ${box1.owner}`)
  console.log(`box2.owner: ${box2.owner}`)
}

main()