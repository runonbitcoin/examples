const { Bip32, Bip39, Address, Tx, KeyPair, Sig, Script, Bn } = require('bsv')
const _ = require('lodash')

/**
 * This is an implementation of run owner api (https://run.network/docs/#api-reference-apis-owner)
 * using an hd-wallet like strategy to calculate the private keys to lock the jigs.
 * 
 * There is a ton of room for decition on wallet dessign. This dessign is an ilustrative dessign
 * that tries to focus on the following things.
 * 
 * - Use bip32 to derive keys. (https://github.com/moneybutton/bips/blob/master/bip-0032.mediawiki)
 * - Use bip39 to recover keys from a mnemonic string (https://github.com/moneybutton/bips/blob/master/bip-0039.mediawiki)
 * - Be compliant with Bip44 gap limit (https://github.com/moneybutton/bips/blob/master/bip-0044.mediawiki#Address_gap_limit)
 * - Separate the state of the HdOwner with the logic of the HdOwner. That's
 *   why all the state is saved in a "db" object. In this example the db is just
 *   a set of collections in memory, but it's easy to map this to a real db.
 * - Always known the addresses for all the keys that could potentially generate signatures.
 *   Withouth this if the same seed is used in 2 instances one of them could eventually generate
 *   signatures with keys that the other one is not monitoring.
 */
class HdOwner {
  constructor (mnemonicString, db) {
    // Getting extended private key from mnemonic string
    // This involves 2 standards: Bip32 and Bip39
    this.bip32 = Bip32.fromSeed(
      Bip39.fromString(mnemonicString.trim()).toSeed()
    ).derive(HdOwner.BASE_PATH)

    this.db = db
  }

  /**
   * Because the initialization involves async calls to the db it cannot
   * happen during the construction of the object and instead happes here.
   */
  async initialize () {
    let data = await this.db.findWalletDataByXpub(this.bip32.toPublic().toString())
    if (!data) {
      data = await this.db.createWalletData(this.bip32.toPublic().toString())
    }
    this.walletDataId = data.id
    await this._fillAddresses(data.upperBound)
  }


  /**
   * First method of run owner interface.
   */
  async nextOwner () {
    // Gets the needed data find the new address
    const { lowerBound, upperBound, nextIndex } = await this.db.findWalletDataById(this.walletDataId)
    const { address } = await this.db.addressByIndex(this.walletDataId, nextIndex)
    // Updates the indexes to ensure that the next address is going to be different.
    await this._bumpNextIndex(lowerBound, upperBound, nextIndex)
    return address.toString()
  }

  
  
  /**
   * Second method of Run's owner interface.
   * 
   * Sign a tx is a little bit tricky because we need
   * to consider all the addresses and also update the known
   * addresses and indexes.
   * @param {string} rawTx 
   * @param {Array} parents - object with form { satoshis: Number, script: hexString }
   * @param {Array} locks - list of Locks: https://run.network/docs/#api-reference-apis-lock
   * @returns string 
   */
  async sign(rawTx, parents, locks) {
    // First we need to get all the known addresses incolved in this sign.
    const allAddressesStr = locks
      .filter(lock => lock)
      .map(lock => lock.address)
    const allAddressesDb = await this.db.findManyAddreses(this.walletDataId, allAddressesStr)

    // Then we actually sign the tx.
    const signedRawTx = this._performSignature(rawTx, parents, locks, allAddressesDb)

    // Then we calculate all the new indexes.
    const maxIndexUsed = Math.max(
      ...allAddressesDb.map(a => a.index)
    )
    let { lowerBound, upperBound, nextIndex } = await this.db.findWalletDataById(this.walletDataId)
    lowerBound = Math.max(maxIndexUsed + 1, lowerBound)
    upperBound = lowerBound + 20

    // We update the new indexes in the db.
    await this.db.updateWalletDataById(this.walletDataId, { lowerBound, upperBound, nextIndex })

    // Ensure that we always know the 20 addresses after
    // the last one used.
    await this._fillAddresses(upperBound)
    return signedRawTx
  }

  _performSignature (unsignedRawTx, parents, locks, addressesObject) {
    // Parse tx
    const tx = Tx.fromHex(unsignedRawTx)

    // Iterate each pair of [parent, lock]. They should always have the same size
    _.zip(parents, locks).forEach(([parent, lock], nIn) => {
      // If lock is undefined that means that the input is not related to run.
      if (!lock) {
        return
      }

      // Check if the address actually bellongs to this owner.
      const relatedAddress = addressesObject.find(o => o.address === lock.address)
      if (relatedAddress) {
        const keyPair = KeyPair.fromPrivKey(this.bip32.deriveChild(relatedAddress.index).privKey)

        // Calculate signature
        const signature = tx.sign(
          keyPair,
          Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID,
          nIn,
          Script.fromHex(parent.script),
          new Bn().fromNumber(parent.satoshis),
          Tx.SCRIPT_ENABLE_SIGHASH_FORKID
        )
        
        // apply signature
        const unlockingScript = new Script([])
        unlockingScript.writeBuffer(signature.toTxFormat())
        unlockingScript.writeBuffer(keyPair.pubKey.toBuffer())
        tx.txIns[nIn].setScript(unlockingScript)
      }
    })
    
    return tx.toHex()
  }

  async _bumpNextIndex (lowerBound, upperBound, nextIndex) {
    // Ensures that the next address is always between the calculated set.
    nextIndex = nextIndex + 1
    if (nextIndex >= upperBound) {
      nextIndex = lowerBound
    }
    await this.db.updateWalletDataById(this.walletDataId, { lowerBound, upperBound, nextIndex })
  }

  /**
   * Derives adddress starting from the last one calculated
   * up to certain limit.
   * @param {Number} upperBound 
   */
  async _fillAddresses (upperBound) {
    const lowerBound = await this.db.lastAddressIndexForWallet(this.walletDataId)
    await Promise.all(_.range(lowerBound, upperBound).map(async (index) => {
      const address = Address.fromPubKey(this.bip32.deriveChild(index).pubKey)
      await this.db.createAddress(this.walletDataId, address.toString(), index)
    }))
  }
}

HdOwner.BASE_PATH = "m/0'/0"

module.exports = { HdOwner }