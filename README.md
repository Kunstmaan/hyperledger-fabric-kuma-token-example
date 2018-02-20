# Kuma token

This a simple example of a token created on the [Hyperledger Fabric platform](https://hyperledger-fabric.readthedocs.io/en/release/). It exists out of a simple wallet system that can be used to exchange Kuma-tokens and a multisig system that can be used for setting up multisig contracts between users.

This repository exists out of three parts:
* [The network configuration](./network), containing all the crypto stuff, channel artifacts and docker compose files.
* [The chaincode](./chaincode), containing the chaincode itself written in Node.js.
* [The client](./client), which is a simple CLI tool that can be used to interact with the chaincode.

This project also shows how the different tools we created for the Hyperledger Fabric platform can be used:
* [Hyperledger Fabric network setup](https://github.com/Kunstmaan/hyperledger-fabric-network-setup)
* [Hyperledger Fabric chaincode dev setup](https://github.com/Kunstmaan/hyperledger-fabric-chaincode-dev-setup)
* [Hyperledger Fabric Node chaincode utils](https://github.com/Kunstmaan/hyperledger-fabric-node-chaincode-utils)
* [Hyperledger Fabric client utils](https://github.com/Kunstmaan/hyperledger-fabric-client-utils)
