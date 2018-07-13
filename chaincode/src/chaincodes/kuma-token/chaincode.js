const shim = require('fabric-shim');
const {ChaincodeBase, ChaincodeError} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const ERRORS = require('./common/constants/errors');
const CONSTANTS = require('./common/constants/index');

const AbstractWallet = require('./models/AbstractWallet');
const UserWallet = require('./models/UserWallet');
const ContractWallet = require('./models/ContractWallet');

const Joi = require('./common/services/joi');

const KumaTokenChaincode = class extends ChaincodeBase {

    /**
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {Float} amount the coins to transfer from wallet id fromAddress to wallet id toAddress
     * @param {String} toAddress the address of the wallet that should receive the coins
     * @param {String} fromAddress (optional) the address of the wallet that should send the coins.
     *                 If undefined, will be set to the caller's wallet
     */
    async transfer(stub, txHelper, amount, toAddress, fromAddress = undefined) {
        const schema = Joi.object().keys({
            amount: Joi.number().required().positive(),
            toAddress: Joi.string().required().walletId(),
            fromAddress: Joi.string().optional().walletId()
        });

        try {
            await schema.validate({
                amount, toAddress, fromAddress
            });
        } catch (error) {
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        let fromWallet;
        if (fromAddress) {
            fromWallet = await AbstractWallet.queryWalletByAddress(txHelper, fromAddress);

            if (!fromWallet) {

                throw new ChaincodeError(ERRORS.UNKNWON_WALLET, {
                    'address': fromAddress
                });
            }
        } else {
            fromWallet = await this.retrieveOrCreateMyWallet(stub, txHelper);
        }

        const toWallet = await AbstractWallet.queryWalletByAddress(txHelper, toAddress);

        if (!toWallet) {

            throw new ChaincodeError(ERRORS.UNKNOWN_ENTITY, {
                'address': toAddress
            });
        }

        if (!fromWallet.txCreatorHasPermissions(txHelper)) {

            throw new ChaincodeError(ERRORS.NOT_PERMITTED, {
                'address': fromWallet.address
            });
        }

        if (!fromWallet.canSpendAmount(amount)) {

            throw new ChaincodeError(ERRORS.INSUFFICIENT_FUNDS, {
                'address': fromWallet.address
            });
        }

        fromWallet.addAmount(-amount);
        toWallet.addAmount(amount);

        this.logger.info(`Transfering ${amount} from ${fromWallet.address} to ${toAddress.address}`);

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
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {String} address
     */
    async retrieveWallet(stub, txHelper, address) {
        const schema = Joi.object().keys({
            address: Joi.string().required().walletId()
        });

        try {
            await schema.validate({
                address
            });
        } catch (error) {
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        return AbstractWallet.queryWalletByAddress(txHelper, address);
    }

    /**
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
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {String} chaincodeName
     * @param {Array} chaincodeFunctions (optional)
     */
    async createContractWallet(stub, txHelper, chaincodeName, chaincodeFunctions) {
        const schema = Joi.object().keys({
            chaincodeName: Joi.string().required(),
            chaincodeFunctions: Joi.array().required().items(Joi.string()).min(1)
        });

        try {
            await schema.validate({
                chaincodeName,
                chaincodeFunctions
            });
        } catch (error) {
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }


        return new ContractWallet({
            chaincodeName,
            chaincodeFunctions,
            address: txHelper.uuid(CONSTANTS.PREFIXES.WALLET),
            amount: 0
        }).save(txHelper);
    }

};

shim.start(new KumaTokenChaincode(shim));
