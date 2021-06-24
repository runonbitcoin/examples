const Run = require('run-sdk')
require('dotenv/config')
var qrcode = require('qrcode-terminal');
const { Dragon } = require('./jigs/dragon')
const fs = require('fs')

let trustlist = null
try {
  trustlist = require('./trustlist.json')
} catch (e) {
  console.log('No trustlist yet...')
  trustlist = []
}

const main = async () => {
  // Create RUN instance.
  const purseWif = process.env.PURSE_WIF
  const ownerWif = process.env.OWNER_WIF
  const run = new Run({ network: 'test', owner: ownerWif, purse: purseWif })

  try {
    // Check if it was deployed before
    if (trustlist.some(t => t.className === Dragon.name)) {
      console.log('class already deployed')
      process.exit(0)
    }

    // Actual deploy
    run.deploy(Dragon)
    await run.sync()
    console.log(`deployed Dragon. location: ${Dragon.location}`)
    trustlist.push({ className: Dragon.name, location: Dragon.location })
    fs.writeFileSync(`${__dirname}/trustlist.json`, JSON.stringify(trustlist, null, 2))
  } catch (e) {
    console.log(e)
    console.log('Deploy fail. Maybe the purse is empty. You can send testnet bsv here:')
    console.log('')
    console.log(run.purse.address)
    qrcode.generate(run.purse.address)
  }
}

main()