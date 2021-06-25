const { buildRun, Run } = require('./build-run')
const trustlist = require('./trustlist')

const main = async () => {
  const run = buildRun()
  
  const Dragon = await run.load(trustlist.all().find(t => t.className === 'Dragon').location)

  const tx = new Run.Transaction()

  tx.update(() => new Dragon('Kimberly'))
  tx.update(() => new Dragon('Tommy'))
  tx.update(() => new Dragon('Trini'))
  tx.update(() => new Dragon('Jason'))
  tx.update(() => new Dragon('Billy'))
  tx.update(() => new Dragon('Zack'))

  await tx.publish()
}

main()