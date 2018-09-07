const {ChaincodeError, utils} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const CONSTANTS = require('./../common/constants');
const ERRORS = require('./../common/constants/errors');

const logger = utils.logger.getLogger('models/AbstractWallet');

class AbstractWallet {

    /**
    *   Queries the wallet corresponding to this address
    *   @param {String} address the address of the wallet to return
    *   @return the wallet
    *   @throws an error if the address is not found
    */
    static async queryWalletByAddress(txHelper, address) {
        const dbData = await txHelper.getStateAsObject(address);
        if(!dbData) {
            throw new ChaincodeError(ERRORS.UNKNOWN_ENTITY, {
                'address': address
            });
        }
        return mapDBDataToObject(dbData);
    }

    /**
    *   Queries wallets given a specific query
    *   @param {Object} query the query to process
    *   @return {Array} array of wallets corresponding to the query
    */
    static async queryWallets(txHelper, type, query) {
        const allResults = await txHelper.getQueryResultAsList({
            'selector': {
                '$and': [
                    {
                        'type': type
                    },
                    query
                ]
            }
        });

        logger.debug(`Query Result ${allResults}`);

        return allResults.map((result) => result.record).map(mapDBDataToObject);
    }

    /**
    *   The properties of this wallet
    */
    get properties() {

        return {};
    }

    set properties(value) {
        // ABSTRACT doesn't have properties, do nothing
    }

    /**
    *   Creates a new wallet
    *   @param {String} address the address of the wallet
    *   @param {Amount} float the initial amount of the wallet. Defaults to 0
    */
    constructor({address, amount = 0.0, type = CONSTANTS.WALLET_TYPES.ABSTRACT}) {
        this.address = address;
        this.amount = amount;
        this.type = type;
    }

    /**
    *   @param {float} amount the amount to add
    */
    addAmount(amount) {
        this.amount += amount;

        return this;
    }

    /**
    *   @param {float} amount the amount to spend
    *   @return {boolean} true if the wallet has at least "amount" coins
    */
    canSpendAmount(amount) {

        return this.amount - amount >= 0;
    }

    /**
    *   @returns true if the caller can spend funds on this wallet
    */
    txCreatorHasPermissions() {

        return false;
    }

    /**
    *   Saves the wallet on the blockchain
    *   @param {TransactionHelper} txHelper
    */
    async save(txHelper) {
        await txHelper.putState(this.address, {
            'address': this.address,
            'amount': this.amount,
            'type': this.type,
            'properties': this.properties
        });

        return this;
    }

}

module.exports = AbstractWallet;

/**
*   Converts a database wallet to a specific instance of a wallet.
*   @param {Object} dbData the wallet as retrieved from the blockchain
*   @return {Instance} an instance of the wallet, given its type (ContractWallet or UserWallet)
*/
function mapDBDataToObject(dbData) {
    // Make sure the wallet is not abstract, and that it's of a known type.
    if (!Object.keys(CONSTANTS.WALLET_TYPE_CLASSNAME_MAPPING).includes(dbData.type)) {

        throw new ChaincodeError(ERRORS.TYPE_ERROR, {
            'type': dbData.type
        });
    }

    // Retrieve the wallet's class
    const className = CONSTANTS.WALLET_TYPE_CLASSNAME_MAPPING[dbData.type];
    const Class = require(`./${className}`);

    // Create an instance of that class
    const instance = new Class({
        address: dbData.address,
        amount: dbData.amount,
        type: dbData.type
    });

    // Add any possible properties
    instance.properties = dbData.properties || {};

    // Return the instance
    return instance;
}
