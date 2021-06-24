FROM ubuntu:20.04

# Download bitcoin binary
RUN apt-get update
RUN apt-get install wget -y
RUN wget -O 'bitcoinsv.tar.gz' https://download.bitcoinsv.io/bitcoinsv/1.0.8/bitcoin-sv-1.0.8-x86_64-linux-gnu.tar.gz
RUN tar -xvf bitcoinsv.tar.gz
RUN mv ./bitcoin-sv-1.0.8 /bitcoin-sv

# workdir
RUN mkdir bitcoin
WORKDIR /bitcoin
COPY bitcoin.conf /bitcoin/bitcoin.conf

RUN mkdir data

# rpc
EXPOSE 18332

# zmq
EXPOSE 28332

CMD ["/bitcoin-sv/bin/bitcoind", "-datadir=/bitcoin/data", "-conf=/bitcoin/bitcoin.conf"]