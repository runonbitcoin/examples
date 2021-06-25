const Run = require('run-sdk')
require('dotenv/config')
const trustlist = require('./.trustlist.json')


const buildRun = () => {
  const purseWif = process.env.PURSE_WIF
  const ownerWif = process.env.OWNER_WIF
  const client = false
  const cache = new Run.plugins.RunDB(`http://localhost:${process.env.RUN_DB_PORT}`)
  const run = new Run({ network: 'test', owner: ownerWif, purse: purseWif, client, cache })

  trustlist.forEach(t => run.trust(t.location.split('_')[0]))

  return run
}

module.exports = { buildRun, Run }