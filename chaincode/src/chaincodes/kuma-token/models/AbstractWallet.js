const {ChaincodeError, utils} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils');

const CONSTANTS = require('./../common/constants');
const ERRORS = require('./../common/constants/errors');

const logger = utils.logger.getLogger('models/AbstractWallet');

class AbstractWallet {

    static async queryWalletByAddress(txHelper, address) {
        const dbData = await txHelper.getStateAsObject(address);

        return mapDBDataToObject(dbData);
    }

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

    get properties() {

        return {};
    }

    set properties(value) {
        // ABSTRACT doesn't have properties, do nothing
    }

    constructor({address, amount = 0.0, type = CONSTANTS.WALLET_TYPES.ABSTRACT}) {
        this.address = address;
        this.amount = amount;
        this.type = type;
    }

    addAmount(amount) {
        this.amount += amount;

        return this;
    }

    canSpendAmount(amount) {

        return this.amount - amount >= 0;
    }

    txCreatorHasPermissions() {

        return false;
    }

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

function mapDBDataToObject(dbData) {
    if (!Object.keys(CONSTANTS.WALLET_TYPE_CLASSNAME_MAPPING).includes(dbData.type)) {

        throw new ChaincodeError(ERRORS.TYPE_ERROR, {
            'type': dbData.type
        });
    }

    const className = CONSTANTS.WALLET_TYPE_CLASSNAME_MAPPING[dbData.type];
    const Class = require(`./${className}`);

    const instance = new Class({
        address: dbData.address,
        amount: dbData.amount,
        type: dbData.type
    });

    instance.properties = dbData.properties || {};

    return instance;
}
