const { buildRun, Run } = require('./build-run')
const trustlist = require('./trustlist')

const main = async () => {
  const run = buildRun()
  
  const Dragon = await run.load(trustlist.all().find(t => t.className === 'Dragon').location)

  await run.inventory.sync()
  
  const dragons = run.inventory.jigs.filter(jig => jig instanceof Dragon)
  
  const tx = new Run.Transaction()

  tx.update(() => {
    dragons.forEach(dragon => dragon.fly([3,3]))
  })

  await tx.publish()
}

main()