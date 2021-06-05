const { Bip32, Bip39, Address } = require('bsv')
const { CommonLock } = require('run-sdk').util
const { range } = require('lodash')

class Owner {
  constructor (mnemonicString, db) {
    this.bip32 = Bip32.fromSeed(
      Bip39.fromString(mnemonicString.trim()).toSeed()
    ).derive(Owner.BASE_PATH)
    this.db = db
    this.lowerBound = 0
    this.nextIndex = 0
    this.upperBound = 20
    this.byAddress = new Map()
    this.byIndex = new Map()
    this._fillAddresses()
  }

  async nextOwner () {
    const { address } = this.byIndex.get(this.nextIndex)
    this._bumpNextIndex()
    return new CommonLock(address.toString(), false)
  }

  async sign(rawTx, parents, locks) {
    const allIndexes = locks
      .filter(lock => this.byAddress.get(lock.address))
      .map(lock => {
        const { index } = this.byAddress.get(lock.address)
        return index
      })
    const maxIndex = Math.max(...allIndexes)
    this.lowerBound = Math.max(maxIndex + 1, this. lowerBound)
    this.upperBound = this.lowerBound + 20 
    this._fillAddresses()
  }

  _bumpNextIndex () {
    this.nextIndex = this.nextIndex + 1
    if (this.nextIndex >= this.upperBound) {
      this.nextIndex = this.lowerBound
    }
  }

  _fillAddresses () {
    range(this.lowerBound, this.upperBound).forEach((index) => {
      const address = Address.fromPubKey(this.bip32.deriveChild(index).pubKey)
      this.byAddress.set(address.toString(), {
        index
      })
      this.byIndex.set(index, { address: address.toString() })
    })
  }
}

Owner.BASE_PATH = "m/0'/0"

module.exports = { Owner }