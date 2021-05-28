const Run = require('run-sdk')

class Ticket extends Run.Jig {
  init (event, owner, id) {
    this.event = event
    this.owner = owner
    this.id = id
  }

  send (to) {
    this.owner = to
  }
}

module.exports = { Ticket }
