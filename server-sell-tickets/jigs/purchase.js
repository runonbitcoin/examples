const Run = require('run-sdk')
const { Event } = require('./event')

const { expect } = Run.extra

/**
 * This class represents the action of purchasing a ticket for an
 * event. The owner of the event can transform this into a ticket.
 */
class Purchase extends Run.Jig {
  init (event, buyer) {
    expect(event).toBeInstanceOf(Event)
    this.event = event
    // The buyer is who is going to own the purchase ticket after redeem the purchase
    this.buyer = buyer

    // The owner of the purchase is the owner of the event, because they
    // have to actually transform this into a ticket
    this.owner = event.owner

    // The amount of satoshis has to be at least the price of the event + the
    // cost of the transaction needed to create the ticket.
    this.satoshis = event.priceSatoshis + Event.txCost
  }
}

Purchase.deps = {
  Event,
  expect
}

module.exports = { Purchase }
