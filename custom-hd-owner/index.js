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
  // Initialize run instance with an HdOwner
  const db = new DB()
  const aMnemonic = 'trap note skull stool throw submit behind outer language victory bar pitch'
  const owner = new HdOwner(aMnemonic, db)
  await owner.initialize()
  const run = new Run({ network: 'mock', owner })

  // Get Some Jigs
  const DeployedBox = run.deploy(Box)
  const box1 = new DeployedBox('gems')
  const box2 = new DeployedBox('gold')
  await run.sync()

  // Both boxes are secured with different owner locks
  console.log(`box1.owner: ${box1.owner}`)
  console.log(`box2.owner: ${box2.owner}`)

  // yet both can be updated
  box1.update('more gems')
  await box1.sync()
  box2.update('more gold')
  await box2.sync()

  // and now both of them are secured with new owner locks
  console.log(`box1.owner: ${box1.owner}`)
  console.log(`box2.owner: ${box2.owner}`)

  // Because the state is saved in a new owner
  // instance is going to be able to handle the jigs
  const anotherOwnerInstance = new HdOwner(aMnemonic, db)
  await anotherOwnerInstance.initialize()
  run.owner = anotherOwnerInstance


  // More updates
  box1.update('even more gems')
  await box1.sync()
  box2.update('even more gold')
  await box2.sync()
  
  // and there are new addresses following the hd wallet conventions.
  console.log(`box1.owner: ${box1.owner}`)
  console.log(`box2.owner: ${box2.owner}`)
}

main()