class DB {
  constructor () {
    this.walletDatasByXpub = new Map()
    this.walletDatasById = new Map()
    this.addressesPerWallet = new Map()
  }
  async findWalletDataByXpub(anXpubStr) {
    return this.walletDatasByXpub.get(anXpubStr)
  }

  async findWalletDataById(id) {
    return this.walletDatasById.get(id)
  }

  async updateWalletDataById(walletDataId, { lowerBound, upperBound, nextIndex }) {
    const oldWalletData = this.walletDatasById.get(walletDataId)
    const newWalletData = { 
      ...oldWalletData,
      lowerBound, 
      upperBound, 
      nextIndex 
    }
    this.walletDatasById.set(oldWalletData.id, newWalletData)
    this.walletDatasByXpub.set(oldWalletData.xpub, newWalletData)
  }

  async createWalletData (xPubStr) {
    const walletData = {
      id: this.walletDatasById.size,
      xpub: xPubStr,
      lowerBound: 0,
      upperBound: 20,
      nextIndex: 0
    }

    this.walletDatasByXpub.set(walletData.xpub, walletData)
    this.walletDatasById.set(walletData.id, walletData)
    this.addressesPerWallet.set(walletData.id, [])
    return walletData
  }

  async createAddress(walletDataId, addressStr, index, used = false) {
    const addresses = this.addressesPerWallet.get(walletDataId)
    addresses.push({
      walletId: walletDataId,
      address: addressStr,
      index,
      used
    })
  }

  async addressByIndex(walletDataId, addressIndex) {
    const addresses = this.addressesPerWallet.get(walletDataId)
    const address = addresses.find(a => a.index === addressIndex)
    return address
  }

  async findManyAddreses(walletDataId, addressesStr) {
    const addresses = this.addressesPerWallet.get(walletDataId)
    return addresses.filter(a => addressesStr.includes(a.address)) 
  }

  async lastAddressIndexForWallet(walletDataId) {
    const addresses = this.addressesPerWallet.get(walletDataId)
    return Math.max(0, ...addresses.map(a => a.index))
  }
}

module.exports = { DB }