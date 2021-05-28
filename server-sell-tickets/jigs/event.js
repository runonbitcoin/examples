const Run = require('run-sdk');
const { Ticket } = require('./ticket')

const { expect } = Run.extra

class Event extends Run.Jig {
  init (name, priceSatoshis) {
    this.name = name
    this.priceSatoshis = priceSatoshis
    this.ticketsEmited = 0
  }

  /**
   * This method takes a purchase. It uses that purchase to create
   * a ticket and then destroys the purchase.
   */
  emitTicket(purchase) {
    expect(purchase.owner).toEqual(this.owner)
    expect(purchase.satoshis).toBeGreaterThanOrEqualTo(this.priceSatoshis + Event.txCost)
    expect(purchase.event).toEqual(this)

    this.ticketsEmited = this.ticketsEmited + 1
    const ticket = new Ticket(this, purchase.buyer, this.ticketsEmited)
    purchase.destroy()
    return ticket
  }
}

Event.txCost = 600

Event.deps = {
  expect,
  Ticket
}

module.exports = { Event }