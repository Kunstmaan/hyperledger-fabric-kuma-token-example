# Kuma token chaincode

This project exists out of two chaincodes written in Node.js, which is supported since Hyperledger Fabric 1.1.0:
* [kuma-token](./src/chaincodes/kuma-token), which is responsible for the wallet system.
* [multisig](./src/chaincodes/multisig), which is responsible for setting up multisig contracts and links a wallet from the kuma-token chaincode to this contract.

The chaincodes are generated using the [Hyperledger Fabric chaincode dev setup](https://github.com/Kunstmaan/hyperledger-fabric-chaincode-dev-setup) and make use of the [Hyperledger Fabric Node chaincode utils](https://github.com/Kunstmaan/hyperledger-fabric-node-chaincode-utils).

If you'd like to see what the stub argument of the chaincode can be used for, here is the link to the official documentation of [hyperledger fabric shim](https://fabric-shim.github.io/fabric-shim.ChaincodeStub.html): 

You can start the blockchain in devmode by executing `npm run start`. This will use the [generated network configuration](./../network).
