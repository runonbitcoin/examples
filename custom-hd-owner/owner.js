const { Bip32, Bip39, Address, Tx, KeyPair, Sig, Script, Bn } = require('bsv')
const { CommonLock } = require('run-sdk').util
const _ = require('lodash')

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
    const signedRawTx = this.performSignature(rawTx, parents, locks, allAddressesDb)
    const maxIndexUsed = Math.max(
      ...allAddressesDb.map(a => a.index)
    )
    let { lowerBound, upperBound, nextIndex } = await this.db.findWalletDataById(this.walletDataId)
    lowerBound = Math.max(maxIndexUsed + 1, lowerBound)
    upperBound = lowerBound + 20
    await this.db.updateWalletDataById(this.walletDataId, { lowerBound, upperBound, nextIndex })
    await this._fillAddresses({ lowerBound, upperBound })
    return signedRawTx
  }

  performSignature (unsignedRawTx, parents, locks, addressesObject) {
    const tx = Tx.fromHex(unsignedRawTx)
    _.zip(parents, locks).forEach(([parent, lock], nIn) => {
      const relatedAddress = addressesObject.find(o => o.address === lock.address)
      if (relatedAddress) {
        const keyPair = KeyPair.fromPrivKey(this.bip32.deriveChild(relatedAddress.index).privKey)
        const signature = tx.sign(
          keyPair,
          Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID,
          nIn,
          Script.fromHex(parent.script),
          new Bn().fromNumber(parent.satoshis),
          Tx.SCRIPT_ENABLE_SIGHASH_FORKID
        )
        const unlockingScript = new Script([])
        unlockingScript.writeBuffer(signature.toTxFormat())
        unlockingScript.writeBuffer(keyPair.pubKey.toBuffer())
        tx.txIns[nIn].setScript(unlockingScript)
      }
    })
    return tx.toHex()
  }

  async _bumpNextIndex (lowerBound, upperBound, nextIndex) {
    nextIndex = nextIndex + 1
    if (nextIndex >= upperBound) {
      nextIndex = lowerBound
    }
    await this.db.updateWalletDataById(this.walletDataId, { lowerBound, upperBound, nextIndex })
  }

  async _fillAddresses ({ lowerBound, upperBound }) {
    await Promise.all(_.range(lowerBound, upperBound).map(async (index) => {
      const address = Address.fromPubKey(this.bip32.deriveChild(index).pubKey)

      await this.db.createAddress(this.walletDataId, address.toString(), index)
    }))
  }
}

Owner.BASE_PATH = "m/0'/0"

module.exports = { Owner }