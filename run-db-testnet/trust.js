const axios = require('axios')
require('dotenv/config')
const trustlist = require('./trustlist')

const RUN_DB_URL = `http://localhost:${process.env.RUN_DB_PORT}`

const main = async () => {
  await Promise.all(
    trustlist.all().map(async (obj) => axios.post(`${RUN_DB_URL}/trust/${obj.location.split('_')[0]}`))
  )
}

main()