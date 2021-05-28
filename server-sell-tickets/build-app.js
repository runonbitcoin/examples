const express = require('express')
const { Purchase } = require('./jigs/purchase')
const { Event } = require('./jigs/event')
const { Ticket } = require('./jigs/ticket')
const asyncHandler = require('express-async-handler')

/**
 * This function builds an express app. It takes
 * a run instance as a dependency.
 *
 * In this app we decided to communicate with the clients
 * exchanging jig locations. This is an easy way to keep
 * the reponses and reqests tiny.
 */
const buildApp = async (run) => {
  const app = express()

  app.use(express.json())

  /**
   * In a real production environment there are better ways to
   * mange the deployment of the code. See https://run.network/docs/#advanced-usage-code-presets
   */
  run.activate()
  run.deploy(Purchase)
  run.deploy(Event)
  run.deploy(Ticket)

  // Create some events. In a prod envieronment this could be saved in a db.
  const events = [
    new Event('BSV-con', 5000),
    new Event('RUN-con', 10000)
  ]

  // Ensure that all the code is deployed and the events are created.
  await run.sync()

  app.use((_req, _res, next) => {
    // In our example we have more than one instance of run, so we need to ensure
    // that the server one is active for each request. This is not needed if the
    // instance used in the server is the only one.
    run.activate()
    next()
  })

  /**
   * Our server provides the clients whith the location of the code needed
   * to interact with the app
   */
  app.get('/class-locations', asyncHandler(async (_req, res) => {
    await run.sync()
    res.send({
      ticketClassLocation: Ticket.location,
      eventClassLocation: Event.location,
      purchaseClassLocation: Purchase.location
    })
  }))

  /**
   * Returns the list of events
   */
  app.get('/events', (_req, res) => {
    res.send({
      eventLocations: events.map(event => event.location)
    })
  })

  /**
   * Consumes a purchase to generate a ticket.
   */
  app.post('/submit-purchase', asyncHandler(async (req, res) => {
    const {
      purchaseLocation,
      eventLocation
    } = req.body

    const purchase = await run.load(purchaseLocation)
    const event = await run.load(eventLocation)

    const ticket = event.emitTicket(purchase)
    await run.sync()

    res.send({
      ticketLocation: ticket.location
    })
  }))

  return app
}

module.exports = { buildApp }
