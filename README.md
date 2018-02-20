# Kuma token

This a simple example of a token created on the [Hyperledger Fabric platform](https://hyperledger-fabric.readthedocs.io/en/release/). It exists out of a simple wallet system that can be used to exchange Kuma tokens and a multisig system that can be used for setting up multisig contracts between end users.

This repository exists out of three parts:
* [The network configuration](./network/README.md), containing all the crypto stuff, channel artifacts and docker compose files.
* [The chaincode](./chaincode/README.md), containing the chaincode itself written in Node.js.
* [The client](./client/README.md), which is a simple CLI tool that can be used to interact with the chaincode.
