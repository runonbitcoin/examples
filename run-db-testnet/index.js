const Run = require('run-sdk')

const main = async () => {
  const purseWif = process.env.PURSE_WIF
  const ownerWif = process.env.OWNER_WIF

  const run = new Run({ network: 'test', owner: ownerWif, purse: purseWif })
}

main()