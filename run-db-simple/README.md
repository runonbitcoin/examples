# Simple RUN-DB example

This is a tiny example to understand the usecase of run db.

## How to to run it

### Preparing run-db

You need to have docker and docker compose to get run-db up and running
in this example.

https://docs.docker.com/engine/install/
https://docs.docker.com/compose/install/

Once that's installed it's a good idea to download an snapshot
of the db to have your run-db up and running faster:

```
wget run.network/run-db-snapshots/latest/run.db -O run-db-snapshot.sqlite3
```

Once that's  there you can start your run-db by doing:

`docker-compose up run-db`


This is going to generate a lot of output. That's because run-db is
getting in sync with the bsv blockchain.

Once the output shows that it's up to date, you can go
to a different terminal and continue.

### Running the scripts

There 2 scripts that load the same jig in this example. You can execute
them using npm scripts.

This scripts run using an special library that logs what is going
on with the network activity. You can see the difference in output for
both scripts.

``` bash
npm with-run-db
```

and

``` bash
npm withouth-run-db
```

You'll notice that the one using run-db runs a lot faster and does
only a few requests, while the other one is a lot slower and
makes a lot of requests.

The jig that his example loads is a jig that had a long life. Meaning
that it's state was altered by lots of transactions. In order to
verify the validity of the jig Run needs to go to the original transaction
and re execute every interaction that had ever happened with the jig.

Run db works as a trusted state cache. Using run-db our run instance can
query only the latest state, and trust that is correct withouth doing
further verifications. This is why so much faster.