const { Bip32, Bip39, Address } = require('bsv')
const { CommonLock } = require('run-sdk').util
const { range } = require('lodash')

class Owner {
  constructor (mnemonicString, db) {
    this.bip32 = Bip32.fromSeed(
      Bip39.fromString(mnemonicString.trim()).toSeed()
    ).derive(Owner.BASE_PATH)
    this.db = db
  }

  async initialize () {
    let data = await this.db.findWalletDataByXpub(this.bip32.toPublic().toString())
    if (!data) {
      data = await this.db.createWalletData(this.bip32.toPublic().toString())
    }
    this.walletDataId = data.id
    await this._fillAddresses(data)
  }

  async nextOwner () {
    const { lowerBound, upperBound, nextIndex } = await this.db.findWalletDataById(this.walletDataId)
    const { address } = await this.db.addressByIndex(this.walletDataId, nextIndex)
    await this._bumpNextIndex(lowerBound, upperBound, nextIndex)
    return new CommonLock(address.toString(), false)
  }

  async sign(rawTx, parents, locks) {
    const allAddressesStr = locks
      .map(lock => lock.address)
    const allAddressesDb = await this.db.findManyAddreses(this.walletDataId, allAddressesStr)
    const maxIndexUsed = Math.max(
      ...allAddressesDb.map(a => a.index)
    )
    let { lowerBound, upperBound, nextIndex } = await this.db.findWalletDataById(this.walletDataId)
    lowerBound = Math.max(maxIndexUsed + 1, lowerBound)
    upperBound = lowerBound + 20
    await this.db.updateWalletDataById(this.walletDataId, { lowerBound, upperBound, nextIndex })
    await this._fillAddresses({ lowerBound, upperBound })
  }

  async _bumpNextIndex (lowerBound, upperBound, nextIndex) {
    nextIndex = nextIndex + 1
    if (nextIndex >= upperBound) {
      nextIndex = lowerBound
    }
    await this.db.updateWalletDataById(this.walletDataId, { lowerBound, upperBound, nextIndex })
  }

  async _fillAddresses ({ lowerBound, upperBound }) {
    await Promise.all(range(lowerBound, upperBound).map(async (index) => {
      const address = Address.fromPubKey(this.bip32.deriveChild(index).pubKey)

      await this.db.createAddress(this.walletDataId, address.toString(), index)
    }))
  }
}

Owner.BASE_PATH = "m/0'/0"

module.exports = { Owner }