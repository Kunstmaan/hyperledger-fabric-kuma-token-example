# Kuma token client

The client exposes a simple Command Line Utility that can be used to interact with the chaincode. First make sure the chaincode is running in devmode see [chaincode](./../chaincode/README.md). This client utlity makes use of the [Hyperledger Fabric client utils](https://github.com/Kunstmaan/hyperledger-fabric-client-utils) for creating the [services which interact with the chaincode](./services).

With the following command you can get an overview of all the commands available:

```
node cli.js -h
```

## Pinging the chaincode

This is a simple command that can be used to see if the chaincode is available.

```
node cli.js ping <kuma-token|multisig>
```

If everything is ok, the chaincode will respond with 'pong'. The ping function is part of the ChaincodeBase inside [Hyperledger Fabric Node chaincode utils](https://github.com/Kunstmaan/hyperledger-fabric-node-chaincode-utils). We use this function to make sure the chaincode docker container is launched for all the chaincodes else it's possible certain requests will timeout because it takes a while to start the chaincode container.

## Creating a user

By default there are a few users generated for this repository ([user-1, ..., user-5](./../network/configuration/crypto_config-kuma.yaml)), these users will be part of the [AuthOrg](./../network) and can be used to interact with the chaincode. Every command has the possibility to override the user used for invoking that command by using `--user <name>`.

It's also possible to create a new user by executing the following command:

```
node cli.js create-user <name>
```

For this to work you need to make sure the [Hyperledger Fabric network setup](https://github.com/Kunstmaan/hyperledger-fabric-network-setup) is installed. Because this command uses the [`kuma-hf-network generate-user <name>`](./utils/create-user.js) command in the back.

## Getting the balance of a user

By executing the next command you can retrieve the wallet information for a certain user or based on the wallet address.

```
node cli.js wallet [address]
node cli.js wallet --user <name>
```

## Transfering tokens

With this command it's possible to transfer tokens from one wallet to another.

```
node cli.js transfer <amount> <to> [from]
```

* `amount` is the amount of tokens to transfer
* `to` is the wallet addres where you want to send the tokens to
* `from` can be used to define the wallet address where the tokens should be send from. By default the wallet of the current user is used `--user <name>`

## Creating a multisig contract

Use this command to create a new x-y multisig contract between users.

```
node cli.js multisig-create-contract <users..> --signaturesNeeded x
```

By default the number of signatures needed equals the number of users. 

## Requesting a multisig transfer

With this command it's possible to request a new transfer. This will return a requestTransferId that can be used for getting the info of the request or approving it.

```
node cli.js multisig-request-transfer <amount> <from> <to>
```

* `amount` is the amount of tokens to transfer
* `to` is the wallet addres where you want to send the tokens to
* `from` is either the wallet address or the multisig contract id where the tokens should be send from

## Get info of a multisig transfer request

Get information about a multisig transfer request

```
node cli.js multisig-get-transfer <transferId>
```

## Approving a multisig transfer request

Approve a multisig transfer request

```
node cli.js multisig-get-transfer <transferId>
```

This will send the coins once enough signatures are collected. The number of signatures is based on the `signaturesNeeded` when the contract was created.

## End-to-end tests

There are end-to-end tests written for both services [kuma-token](./services/kuma-token.spec.js) and [multisig](./services/multisig.spec.js). These tests will always regenerate new users. You can run all the tests using:

```
jest services
```

Or run the tests for every service separatly:

```
jest services/kuma-token.spec.js
jest services/multisig.spec.js
```
