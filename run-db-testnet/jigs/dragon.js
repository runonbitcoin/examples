const Run = require('run-sdk')

class Dragon extends Run.Jig {
  init (name) {
    this.name = name
    this.position = [0, 0]
  }

  fly (newPosition) {
    expect(newPosition[0]).toBeInteger()
    expect(newPosition[1]).toBeInteger()
    expect(newPosition.length).toEqual(2)
    this.position = newPosition
  }

  send(to) {
    this.owner = owner
  }
}

Dragon.deps = {
  expect: Run.extra.expect
}

module.exports = { Dragon }