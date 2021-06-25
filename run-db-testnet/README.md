# RUN db with testnet

Run db can consume transactions from different sources. Right now
there is 3 official sources supported: Planaria, MatterCloud and direct connection
with a bitcoin node.

This example connects run db with with a local testnet bitcoin node.

## How to run it.

First you need to sync the local node. You can do that by running:

`docker-compose up bitcoind`

That is going to produce a lot of output. The sync process maight take several
hours. You can check the latest block in sync running:

``` bash
curl --location --request POST 'http://bitcoin:bitcoin@localhost:18332' --data-raw '{"jsonrpc": "1.0", "method": "getblockcount", "params": []}' | jq .result
```

Once the node is in sync you can sync run-db running in a different terminal:


```
docker-compose up run-db
```

Again, there should be a lot of output.

Once it's un sync you can install npm dependencies:

`npm i`

Deploy some jigs:

`node deploy.js`

Create some jigs:

`node create-dragons.js`

And interact with some jigs:

`node fly-dragons.js`
