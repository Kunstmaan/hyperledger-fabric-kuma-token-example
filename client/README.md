# Kuma token client

The client exposes a simple Command Line Utility that can be used to interact with the chaincode. First make sure the chaincode is running in devmode see [chaincode](./../chaincode/README.md). This client utlity makes use of the [Hyperledger Fabric client utils](https://github.com/Kunstmaan/hyperledger-fabric-client-utils) for creating the [services which interact with the chaincode](./services).

With the following command you can get an overview of all the commands available:

```
node cli.js -h
```

## Setting up the environment
By default, all commands use the dev mode, which uses a simpler architecture and different docker container names for the peers and chaincodes. If you started the network with the blockchain_manager.sh, then you are using a network which more ressembles a production network, with all the peers and orderers running (prod network). The prod network uses TLS authentication, which requires you to modify your /etc/hosts file to resolve the host names to your localhost (or in production, nodes could run on different physical machines, in which case they would resolve to the IPs of these machines). By default, all below commands are connecting to the dev network. If you'd like to use the prod network you must prepend `NODE_ENV='prod'` to each command, or run `export NODE_ENV='prod'` to let the commands know you want to connect to the prod network.

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

## API server

To run a simple API server in production mode
```
NODE_ENV='prod' npm run startServer
```

There is then an api to call chaincodes available with:

* To invoke: http://localhost:3000/api/chaincode/invoke?chaincodeId=CHAINCODE_NAME&chaincodeFunction=CHAINCODE_FUNCTION&userId=USER_ID&chaincodeArg=CHAINCODE_ARG_1&chaincodeArg=CHAINCODE_ARG_2&PEER=PEER_NAME

* To query: http://localhost:3000/api/chaincode/query?chaincodeId=CHAINCODE_NAME&chaincodeFunction=CHAINCODE_FUNCTION&userId=USER_ID&chaincodeArg=CHAINCODE_ARG_1&chaincodeArg=CHAINCODE_ARG_2&PEER=PEER_NAME

# Modifying the code
## Modify the chaincode
To setup a development environment, you can either run the devmode network, or run the blockchain_manager in watch mode. Then modify your chaincode and add a new function. The first two arguments of that function must be stub and txHelper, then add your own arguments if any. Once done, save and upgrade the chaincode. If you're using watch mode, just enter the chaincode that you'd like to upgrade. In the back, this will copy your source code to the build folder, merge the common dependencies with the package.json of the chaincode, replace symlinks with directly the files and increase the version number (you can only upgrade chaincode if the version changed) and run npm install.

You now have the latest chaincode running on your blockchain.
## Modify the backend
Add your new function to the services/chaincodeName.js. Decide if it should be an invoke or a query, and you can now use it in your backend logic. For an example on how the backend uses this service, look in the .spec test files.

You can also directly use this new function with the server generic API without changing any backend code.

# FAQ
* I have a CHANNEL NOT FOUND error:
    This is probably because you started the network previously, which created a channel block. It then stopped for some reason, and you are now starting a new network with the `blockchain_manager.sh` script. The network you started will reuse the previously created channel block, from the previous network. The setup script is going to see that this block is already present, and think the channel was created (this feature is useful if you are backing up files and restarting the blockchain to keep previous data). To fix this, just delete the channel.block in `network/generated/channel` or run `blockchain_manager.sh stop --erase` to cleanup your machine before running `blockchain_manager.sh start` command again.



