/**
 * This example demonstrates creating a real jig on testnet using node.js.
 *
 * To run, execute `node example03-testnet.js` from its directory.
 */
 const Run = require('run-sdk')

 const purse = 'cQP1h2zumWrCr2zxciuNeho61QUGtQ4zBKWFauk7WEhFb8kvjRTh'
 const run = new Run({ network: 'test', purse })
 
 async function main () {
   class TradingCard extends Jig {
     setName (name) {
       this.name = name
     }

     send(to) {
       this.owner = to
     }
   }
 
   const token = new TradingCard()
   token.setName('Satoshi Nakamoto')
   await token.sync()
 
   // Try loading the token from its onchain location and comparing
   const token2 = await run.load(token.location)
   
   console.log('Same token: ', token.name === token2.name)

   console.log('Follow the link to see the transaction in whatsonchain:')
   console.log(`https://test.whatsonchain.com/tx/${token.location.split('_')[0]}`)
 }
 
 main().catch(e => console.error(e))