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

Dragon.presets = {
  test: {
    origin: '8f1fe8a89bcd0d3fd5374b25a2969c8ea7871e278fd2973e5fe1abe42bb1360d_o1',
    location: '8f1fe8a89bcd0d3fd5374b25a2969c8ea7871e278fd2973e5fe1abe42bb1360d_o1',
    nonce: 0,
    owner: '13amCautaFqwbWV6MoC86xrh96W4fXGfDV',
    satoshis: 0
  }
}

module.exports = { Dragon }