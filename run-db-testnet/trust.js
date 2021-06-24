// const Run = require('run-sdk')
// require('dotenv/config')
// var qrcode = require('qrcode-terminal');
// const { Dragon } = require('./jigs/dragon')

// const main = async () => {
//   const purseWif = process.env.PURSE_WIF
//   const ownerWif = process.env.OWNER_WIF

//   const run = new Run({ network: 'test', owner: ownerWif, purse: purseWif })
//   run.trust(Dragon.presets.test.location.split('_')[0])

//   const DeployedDragon = await run.load(Dragon.presets.test.location)

//   console.log( DeployedDragon.location )
// }

// main()