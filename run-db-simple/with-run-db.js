const Run = require('run-sdk')

const main = async() => {
  // Initialize run using the local run-db instance.
  const client = true
  const cache = new Run.plugins.RunDB('http://localhost:8000')
  const trust = ['cache']
  const run = new Run({ client, cache, trust })


  const jig = await run.load('605959abd1e6005abf28bb2ddad0b964b0ad23f6c68e0003d3976b59403e66b2_o1')

  console.log('')
  console.log('***************************')
  console.log('*         SUCCESS         *')
  console.log('***************************')
  console.log('')
  console.log(JSON.stringify(jig, null, 2))
}

main()