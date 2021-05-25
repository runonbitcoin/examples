/**
 * This example demonstrates backed jigs by creating an invoice that
 * is for some service performed and sending it to the customer. The
 * customer will add bsv into the jig and send it back to the company.
 * This transaction will also serve as a receipt for both parties.
 *
 * To run, execute:
 * 
 * npm install
 * node inde.js
 */

 const Run = require('run-sdk')
//  const bsv = require('bsv')
 
 // The invoice Jig
 class Invoice extends Jig {
   init (service, date, price, company, customer) {
     this.service = service
     this.date = date
     this.price = price
 
     // Save the pubkeys of the company and customer
     // In a real service, you may want these to be full identities.
     this.company = company
     this.customer = customer
 
     // Send the jig to the customer to pay
     this.owner = customer
   }
 
   pay () {
     this.satoshis += this.price
     this.owner = this.company
   }
 
   withdraw () {
     this.satoshis = 0
   }
 }
 
 // We'll create two runs, one for each user. In the real world, each
 // user would have their own machines, but we want to simulate
 // an invoice transaction within a single program.
 const companyRun = new Run({ network: 'mock' })
 const customerRun = new Run({ network: 'mock' })
 
 let invoice = null
 
 async function companyGeneratesInvoice () {
   companyRun.activate()
 
   invoice = new Invoice('defrag', Date.now(), 1000,
     companyRun.owner.pubkey.toString(), customerRun.owner.pubkey.toString())
 
   await invoice.sync()
 }
 
 async function customerPaysForInvoice () {
   customerRun.activate()
 
   // The invoice class must be "trusted" for another Run instance to load it.
   // The company Run instance that deployed the invoice automatically trusts code it deploys.
   const invoiceClassTxid = Invoice.location.slice(0, 64)
   customerRun.trust(invoiceClassTxid)
 
   invoice.pay()
 
   await invoice.sync()
 }
 
 async function companyWithdrawsPaymentToWallet () {
   companyRun.activate()
 
   invoice.withdraw()
 
   await invoice.sync()
 }
 
 async function main () {
   console.log('Generating invoice')
   await companyGeneratesInvoice()
   console.log('Paying for invoice')
   await customerPaysForInvoice()
   console.log('Withdrawing funds to wallet')
   await companyWithdrawsPaymentToWallet()
 }
 
 main().catch(e => console.error(e))
 