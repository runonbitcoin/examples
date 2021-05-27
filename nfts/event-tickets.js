/**
 * In this example we are going to create
 * nfts that represent tickets for an event.
 * 
 * The owner of the event is the one that can create tickets.
 * Each ticket and each event are unique items
 */
const Run = require('run-sdk')
const bsv = require('bsv')
const Address = require('bsv/lib/address')

const { expect } = Run.extra


/**
 * Tickets are owned by the people
 * that assist to the events.
 * 
 * They can be send to other users.
 */
class Ticket extends Jig {
  /**
   * @param {Event} event this is the event related with the ticket
   * @param {*} id 
   * @param {*} owner 
   */
  init(event, id, owner) {
    this.event = event
    this.id = id
    this.owner = owner
  }

  /**
   * Tickets can be send to other people
   * @param {Lock} to 
   */
  send (to) {
    this.owner = to
  }

  /**
   * When the ticket is consumed to get
   * a spot in the event is returned to the issuer.
   * The issuer can destroy it then.
   */
  redeem () {
    if(this.owner !== even.owner) {
      throw new Error('only the creator can redeem the tickets')
    }

    this.destroy()
  }
}

/**
 * An event can emit tickets. Someone
 * with a ticket can enter into the event.
 * 
 * Each event has a name and a total
 * amount of tickets that can be emited.
 */
 class Event extends Jig {
  init (name, totalChairs) {
    expect(name).toBeString()
    expect(totalChairs).toBeInteger()
    this.name = name
    this.maxTickets = totalChairs
    this.ticketsEmited = 0
  }

  emitTicket (buyer) {
    if (this.ticketsEmited >= this.maxTickets) {
      throw new Error('no more tickets left')
    }
    this.ticketsEmited = this.ticketsEmited + 1

    return new Ticket(this, this.ticketsEmited, buyer)
  }
}

Event.deps = {
  expect,
  Ticket
}

const main = async () => {
  const run = new Run({ network: 'mock' })

  // Create buyer addresses
  const buyer1Address = Address.fromPrivateKey(bsv.PrivateKey.fromRandom()).toString()
  const buyer2Address = Address.fromPrivateKey(bsv.PrivateKey.fromRandom()).toString()
  const buyer3Address = Address.fromPrivateKey(bsv.PrivateKey.fromRandom()).toString()

  // deploy clases
  Event = run.deploy(Event)
  Ticket = run.deploy(Ticket)

  // Create an event
  const anEvent = new Event('Super exclusive event', 3)

  await run.sync()

  // Sell some tickets
  console.log(anEvent.location, anEvent.ticketsEmited)
  const ticket1 = anEvent.emitTicket(buyer1Address)
  await run.sync()
  console.log(anEvent.location, anEvent.ticketsEmited)
  const ticket2 = anEvent.emitTicket(buyer2Address)
  await run.sync()
  console.log(anEvent.location, anEvent.ticketsEmited)
  const ticket3 = anEvent.emitTicket(buyer3Address)
  await run.sync()
  console.log(anEvent.location, anEvent.ticketsEmited)

  // Each ticket is owned by the right owner
  console.log(ticket1.owner, buyer1Address, ticket1.owner === buyer1Address)
  console.log(ticket2.owner, buyer2Address, ticket2.owner === buyer2Address)
  console.log(ticket3.owner, buyer3Address, ticket3.owner === buyer3Address)

  // Selling another ticket fails
  const locationBefore = anEvent.location
  try {
    
    anEvent.emitTicket(Address.fromPrivateKey(bsv.PrivateKey.fromRandom()).toString())
  } catch(e) {
    console.error(e)
    // Because the action failed there was no changes in the jig.
    await anEvent.sync()
    console.log(locationBefore, anEvent.location, locationBefore === anEvent.location)
  }
}

main()