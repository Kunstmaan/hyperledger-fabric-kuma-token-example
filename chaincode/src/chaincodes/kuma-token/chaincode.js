const shim = require('fabric-shim'); // eslint-disable-line
const {ChaincodeBase, ChaincodeError} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const ERRORS = require('./common/constants/errors');
const CONSTANTS = require('./common/constants/index');

const AbstractWallet = require('./models/AbstractWallet');
const UserWallet = require('./models/UserWallet');
const ContractWallet = require('./models/ContractWallet');

const Joi = require('./common/services/joi');

/**
*   Defines the behavior of wallets that can transfer funds from one another,
*   with permissions on who can transfer funds.
*   Can create 2 types of wallets:
*   - User wallets owned by a user
*   - Contract wallets owned by a chaincode
*/
const KumaTokenChaincode = class extends ChaincodeBase {

    /**
     * Transfers some amount from one wallet to another. If the source wallet is not given,
     * will default to the caller's wallet
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {Float} amount the coins to transfer from wallet id fromAddress to wallet id toAddress
     * @param {String} toAddress the address of the wallet that should receive the coins
     * @param {String} fromAddress (optional) the address of the wallet that should send the coins.
     *                 If undefined, will be set to the caller's wallet
     */
    async transfer(stub, txHelper, amount, toAddress, fromAddress = undefined) {
        // Create a schema to validate the user input
        const schema = Joi.object().keys({
            amount: Joi.number().required().positive(),
            toAddress: Joi.string().required().walletId(),
            fromAddress: Joi.string().optional().walletId()
        });

        try {
            // Validate the user input
            await schema.validate({
                amount, toAddress, fromAddress
            });
        } catch (error) {
            // Throw a validation error if arguments are not correct
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        let fromWallet;
        if (fromAddress) {
            // Get the wallet corresponding to fromAddress
            fromWallet = await AbstractWallet.queryWalletByAddress(txHelper, fromAddress);

            if (!fromWallet) {

                throw new ChaincodeError(ERRORS.UNKNWON_WALLET, {
                    'address': fromAddress
                });
            }
        } else {
            // fromAddress was not given, the wallet is thus the caller's wallet
            fromWallet = await this.retrieveOrCreateMyWallet(stub, txHelper);
        }

        // Get the destination wallet
        const toWallet = await AbstractWallet.queryWalletByAddress(txHelper, toAddress);

        if (!toWallet) {

            throw new ChaincodeError(ERRORS.UNKNOWN_ENTITY, {
                'address': toAddress
            });
        }

        // Make sure the caller of this function can make changes to the fromWallet.
        if (!fromWallet.txCreatorHasPermissions(txHelper)) {

            throw new ChaincodeError(ERRORS.NOT_PERMITTED, {
                'address': fromWallet.address
            });
        }

        // Make sure the fromWallet has enough funds to complete the transfer
        if (!fromWallet.canSpendAmount(amount)) {

            throw new ChaincodeError(ERRORS.INSUFFICIENT_FUNDS, {
                'address': fromWallet.address
            });
        }

        // Proceed with the transfer
        fromWallet.addAmount(-amount);
        toWallet.addAmount(amount);

        this.logger.info(`Transfering ${amount} from ${fromWallet.address} to ${toAddress.address}`);

        // Save back the wallets on the blockchain
        return Promise.all([
            fromWallet.save(txHelper),
            toWallet.save(txHelper)
        ]).then(([from, to]) => {

            return {
                'from': from,
                'to': to
            };
        });
    }

    /**
     * Retrieves the wallet corresponding to the given address
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {String} address
     */
    async retrieveWallet(stub, txHelper, address) {
        // Create a schema to validate the user input
        const schema = Joi.object().keys({
            address: Joi.string().required().walletId()
        });

        try {
            // Validate the user input
            await schema.validate({
                address
            });
        } catch (error) {
            // Throw a validation error if arguments are not correct
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        // Retrieve the wallet from the blockchain, given its address
        return AbstractWallet.queryWalletByAddress(txHelper, address);
    }

    /**
     * Retrieves the caller's wallet. If it does not exist, creates one.
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     */
    async retrieveOrCreateMyWallet(stub, txHelper) {
        const myWallet = await UserWallet.queryCurrentUserWallet(txHelper);

        if (myWallet) {

            return myWallet;
        }

        return new UserWallet({
            address: txHelper.uuid(CONSTANTS.PREFIXES.WALLET),
            publicKeyHash: txHelper.getCreatorPublicKey(),
            amount: 1000 // add an inital amount of 1000 tokens
        }).save(txHelper);
    }

    /**
     * Creates a contract wallet. This wallet's funds can only be moved by the supplied chaincode name.
     * If chaincodeFunctions is supplied, this wallet funds can only be moved by the
     * supplied chaincode when called by one of these functions
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {String} chaincodeName The name of the chaincode who can spend funds for this wallet
     * @param {Array} chaincodeFunctions (optional) The name of the functions of the chaincode with
     *                                   name chaincodeName that can be used to spend funds for this wallet.
     *                                   If not supplied, any function from chaincodeName can be used.
     */
    async createContractWallet(stub, txHelper, chaincodeName, chaincodeFunctions) {
        // Create a schema to validate the user input
        const schema = Joi.object().keys({
            chaincodeName: Joi.string().required(),
            chaincodeFunctions: Joi.array().required().items(Joi.string()).min(1)
        });

        try {
            // Validate the user input
            await schema.validate({
                chaincodeName,
                chaincodeFunctions
            });
        } catch (error) {
            // Throw a validation error if arguments are not correct
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        // Create the contract wallet and save it on the blockchain.
        return new ContractWallet({
            chaincodeName,
            chaincodeFunctions,
            address: txHelper.uuid(CONSTANTS.PREFIXES.WALLET),
            amount: 0
        }).save(txHelper);
    }

};

shim.start(new KumaTokenChaincode());
