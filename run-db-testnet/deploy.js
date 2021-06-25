const Run = require('run-sdk')
require('dotenv/config')
var qrcode = require('qrcode-terminal');
const { Dragon } = require('./jigs/dragon')
const trustlist = require('./trustlist')

const main = async () => {
  // Create RUN instance.
  const purseWif = process.env.PURSE_WIF
  const ownerWif = process.env.OWNER_WIF
  const run = new Run({ network: 'test', owner: ownerWif, purse: purseWif })

  try {
    // Check if it was deployed before
    if (trustlist.all().some(t => t.className === Dragon.name)) {
      console.log('class already deployed')
      process.exit(0)
    }

    // Actual deploy
    run.deploy(Dragon)
    await run.sync()
    console.log(`deployed Dragon. location: ${Dragon.location}`)
    trustlist.add(Dragon)
  } catch (e) {
    console.log(e)
    console.log('Deploy fail. Maybe the purse is empty. You can send testnet bsv here:')
    console.log('')
    console.log(run.purse.address)
    qrcode.generate(run.purse.address)
  }
}

main()