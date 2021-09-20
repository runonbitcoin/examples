/**
 * This class is just an hipotetical storage for wallet data.
 * 
 * The idea of the implementation is to resemble a real relational db.
 */
class DB {
  constructor () {
    this.tables = new Map()
    this.tables.set('walletData', [])
    this.tables.set('addresses', [])
  }
  async findWalletDataByXpub(anXpubStr) {
    const walletDataTable = this.tables.get('walletData')
    return walletDataTable.find(walletData => walletData.xpub === anXpubStr)
  }

  async findWalletDataById(id) {
    const walletDataTable = this.tables.get('walletData')
    return walletDataTable.find(walletData => walletData.id === id)
  }

  async updateWalletDataById(walletDataId, { lowerBound, upperBound, nextIndex }) {
    const walletDataTable = this.tables.get('walletData')
    const walletDataIndex = walletDataTable.findIndex(walletData => walletData.id === walletDataId)
    const oldWalletData = walletDataTable[walletDataIndex]
    walletDataTable[walletDataIndex] = { 
      ...oldWalletData,
      lowerBound, 
      upperBound, 
      nextIndex 
    }
  }

  async createWalletData (xPubStr) {
    const walletDataTable = this.tables.get('walletData')
    const walletData = {
      id: walletDataTable.length,
      xpub: xPubStr,
      lowerBound: 0,
      upperBound: 20,
      nextIndex: 0
    }
    walletDataTable.push(walletData)

    return walletData
  }

  async createAddress(walletDataId, addressStr, index) {
    const addressTable = this.tables.get('addresses')
    addressTable.push({
      walletDataId: walletDataId,
      address: addressStr,
      index
    })
  }

  async addressByIndex(walletDataId, addressIndex) {
    const addressTable = this.tables.get('addresses')
    const address = addressTable.find(a => a.index === addressIndex && a.walletDataId === walletDataId)
    return address
  }

  async findManyAddreses(walletDataId, addressesStr) {
    const addressTable = this.tables.get('addresses')
    return addressTable.filter(a => addressesStr.includes(a.address) && a.walletDataId === walletDataId)
  }

  async lastAddressIndexForWallet(walletDataId) {
    const addressTable = this.tables.get('addresses')
    const addresses = addressTable.filter(a => a.walletDataId === walletDataId)
    return Math.max(0, ...addresses.map(a => a.index))
  }
}

module.exports = { DB }