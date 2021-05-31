const Run = require('run-sdk')

const main = async() => {
  const run = new Run()
  run.trust('fa4ae4ebbfe0700d539e7de1e0e7f588dc6c915b459a5d934175cbb1ba82ae71')
  run.cache = new Run.LocalCache()

  const jig = await run.load('605959abd1e6005abf28bb2ddad0b964b0ad23f6c68e0003d3976b59403e66b2_o1')
  
  console.log('')
  console.log('***************************')
  console.log('*         SUCCESS         *')
  console.log('***************************')
  console.log('')
  console.log(JSON.stringify(jig, null, 2))
}

main()