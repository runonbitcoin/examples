const Run = require('run-sdk')
const { txo, expect } = Run.extra

// ----------------------------------------------------------------------------
// Define a berry class to read twetch posts
// ----------------------------------------------------------------------------

class TwetchPost extends Berry {
  init (text) {
    this.text = text
  }

  // The pluck method takes a path and the fetch method, which functions like.
  // run.blockchain.fetch. We use it to parse the tx and tweth data using a txo helper.
  static async pluck (txid, fetch) {
    // The txo returned from fetch is unwriter's txo format
    const data = txo(await fetch(txid))

    // Twetch posts start with a B protocol and put the text in s3
    if (data.out[0].s2 === '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut') {
      return new TwetchPost(data.out[0].s3)
    }
  }
}

TwetchPost.deps = { txo }

// ----------------------------------------------------------------------------
// Read a twetch post and use it in a Jig
// ----------------------------------------------------------------------------

const network = 'main'
const twetchPostTxid = '4e146ac161324ef0b388798462867c29ad681ef4624ea4e3f7c775561af3ddd0'
const purse = 'KwMXfL3R8bBqBVGFq5SXNEPMYhDHNmCTyQJ1vQnp3vqD4Ct9xsvh'

async function main () {
  const run = new Run({ network, purse })

  // Deploy the berry class. This is necessary if we are going to use it in jigs
  run.deploy(TwetchPost)
  await run.sync()

  // Load the twetch post using the berry class
  const post = await TwetchPost.load(twetchPostTxid)

  // Pass the twetch post as a parameter into a jig
  class MyFavoritePost extends Jig {
    init (post) {
      expect(post).toBeInstanceOf(TwetchPost)
      this.post = post
    }
  }

  MyFavoritePost.deps = { TwetchPost, expect }

  const favorite = new MyFavoritePost(post)
  await favorite.sync()

  // Print out the post text to verify we were able to load and store it
  console.log(favorite.post.text)
}

main()
