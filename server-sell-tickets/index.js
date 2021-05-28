/**
 * This is an example of how run can be used from an express server
 * to interact with clients using jigs.
 */

const Run = require('run-sdk')
const { buildApp } = require('./build-app')
const axios = require('axios')

const main = async () => {
  /**
   * Create 2 instances of run. One is going to represent
   * the app and the other one the client interacting with the app.
   */
  const runServer = new Run({ network: 'mock', trust: '*' })
  const runClient = new Run({ network: 'mock' })

  // Build the app server.
  const app = await buildApp(runServer)

  // Start server and await for it to be ready.
  const server = await new Promise(resolve => {
    const server = app.listen(7777, () => resolve(server))
  })

  // Request jig clases used by the app.
  const {
    purchaseClassLocation,
    eventClassLocation,
    ticketClassLocation
  } = await axios.get('http://localhost:7777/class-locations').then(r => r.data)

  // This classes came from an app that the client trust, so the code is trustworthy.
  runClient.activate()
  runClient.trust(purchaseClassLocation.split('_')[0])
  runClient.trust(eventClassLocation.split('_')[0])
  runClient.trust(ticketClassLocation.split('_')[0])

  // Get available events from app
  const { eventLocations } = await axios.get('http://localhost:7777/events').then(r => r.data)

  // Load desired event jig
  runClient.activate()
  const event = await runClient.load(eventLocations[0])
  await event.sync()

  // Generate purchase
  const Purchase = await runClient.load(purchaseClassLocation)
  const clientPurchase = new Purchase(event, await runClient.owner.nextOwner())
  await clientPurchase.sync()

  // Submit purchase to app
  const { ticketLocation } = await axios.post('http://localhost:7777/submit-purchase', {
    purchaseLocation: clientPurchase.location,
    eventLocation: event.location
  }).then(r => r.data)

  // Load purchased ticket
  runClient.activate()
  const ticket = await runClient.load(ticketLocation)

  // Print final ticket location
  console.log(`Ticket: ${ticket.location}`)

  // Stop the server
  server.close()
}
main()