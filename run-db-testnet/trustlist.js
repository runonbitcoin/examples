const fs = require('fs')

class Trustlist {
  constructor (path) {
    this.path = path
    try {
      this.list = require(path)
    } catch (e) {
      console.log('No trustlist yet...')
      this.list = []
    }
  }

  add (klass) {
    if (!klass.location) {
      throw new Error('deploy class first')
    }
    this.list.push({ className: klass.name, location: klass.location })
    this.persist()
  }

  all() {
    return this.list
  }

  persist () {
    fs.writeFileSync(`${__dirname}/trustlist.json`, JSON.stringify(this.list, null, 2))
  }
}

const trustlist = new Trustlist(`${__dirname}/.trustlist.json`)

module.exports = trustlist