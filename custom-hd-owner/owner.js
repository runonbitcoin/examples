const { Bip32, Bip39, Address } = require('bsv')
const { CommonLock } = require('run-sdk').util

class Owner {
  constructor (mnemonicString, db) {
    this.bip32 = Bip32.fromSeed(
      Bip39.fromString(mnemonicString.trim()).toSeed()
    ).derive(Owner.BASE_PATH)
    this.db = db
    this.lowerBound = 0
    this.nextIndex = 0
    this.upperBound = 20
    this.derivedAddresses = new Map()
  }

  async nextOwner () {
    const address = this._deriveAddress()
    return new CommonLock(address.toString(), false)
  }

  async sign(rawTx, parents, locks) {
    const allIndexes = locks
      .filter(lock => this.derivedAddresses.get(lock.address))
      .map(lock => {
        const { index } = this.derivedAddresses.get(lock.address)
        return index
      })
    const maxIndex = Math.max(...allIndexes)
    this.lowerBound = Math.max(maxIndex + 1, this. lowerBound)
    this.upperBound = this.lowerBound + 20 
  }

  _deriveAddress () {
    const address = Address.fromPubKey(this.bip32.deriveChild(this.nextIndex).pubKey)
    this.derivedAddresses.set(address.toString(), {
      index: this.nextIndex
    })
    this.nextIndex = this.nextIndex + 1
    if (this.nextIndex >= this.upperBound) {
      this.nextIndex = this.lowerBound
    }
    return address
  }
}

Owner.BASE_PATH = "m/0'/0"

module.exports = { Owner }