const Run = require('run-sdk')
require('dotenv/config')
var qrcode = require('qrcode-terminal');
const { Dragon } = require('./jigs/dragon')
const fs = require('fs')

const main = async () => {
  const purseWif = process.env.PURSE_WIF
  const ownerWif = process.env.OWNER_WIF

  const run = new Run({ network: 'test', owner: ownerWif, purse: purseWif })

  try {
    run.deploy(Dragon)
    await run.sync()
    console.log(`Dragon location: ${Dragon.location}`)
    fs.appendFileSync(`${__dirname}/trustlist.txt`, Dragon.location.split('_')[0])
  } catch (e) {
    console.log('Deploy fail. Maybe the purse is empty. You can send testnet bsv here:')
    console.log('')
    console.log(run.purse.address)
    qrcode.generate(run.purse.address)
  }
}

main()