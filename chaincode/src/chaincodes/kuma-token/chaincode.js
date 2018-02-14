const shim = require('fabric-shim');
const {ChaincodeBase, ChaincodeError} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const ERRORS = require('./common/constants/errors');
const CONSTANTS = require('./common/constants/index');

const AbstractWallet = require('./models/AbstractWallet');
const UserWallet = require('./models/UserWallet');

const isFloat = require('./common/validators/isFloat');
const isAddress = require('./common/validators/isAddress');

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
        if (!isFloat(amount) || amount < 0) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'amount',
                'value': amount,
                'expected': 'positive float'
            });
        }

        if (!isAddress(toAddress)) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'toAddress',
                'value': toAddress,
                'expected': 'address'
            });
        }

        if (fromAddress && !isAddress(fromAddress)) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'fromAddress',
                'value': fromAddress,
                'expected': 'address'
            });
        }
        
        let fromWallet;
        if (fromAddress) {
            fromWallet = await AbstractWallet.queryWalletById(fromAddress);

            if (!fromWallet) {

                throw new ChaincodeError(ERRORS.UNKNWON_WALLET, {
                    'address': fromAddress
                });
            }
        } else {
            fromWallet = await this.retrieveOrCreateMyWallet(stub, txHelper);
        }

        const toWallet = await AbstractWallet.queryWalletById(toAddress);

        if (!toWallet) {

            throw new ChaincodeError(ERRORS.UNKNWON_WALLET, {
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

        return {
            'fromWallet': fromWallet,
            'toWallet': toWallet
        };
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
            address: txHelper.uuid(CONSTANTS.WALLET),
            publicKeyHash: txHelper.getCreatorPublicKey(),
            amount: 1000 // add an inital amount of 1000 tokens
        }).save();
    }

};

shim.start(new KumaTokenChaincode());
