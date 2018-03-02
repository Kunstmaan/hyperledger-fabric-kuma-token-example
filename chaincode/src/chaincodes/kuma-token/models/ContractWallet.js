const _ = require('lodash'); // eslint-disable-line

const AbstractWallet = require('./AbstractWallet');

const CONSTANTS = require('./../common/constants');

class UserWallet extends AbstractWallet {

    get properties() {
        const properties = {
            'chaincodeName': this.chaincodeName
        };

        if (this.chaincodeFunctions) {
            properties.chaincodeFunctions = this.chaincodeFunctions;
        }

        return properties;
    }

    set properties(properties) {
        this.chaincodeName = properties.chaincodeName;

        if (properties.chaincodeFunctions) {
            this.chaincodeFunctions = properties.chaincodeFunctions;
        }
    }

    constructor({chaincodeName, chaincodeFunctions, ...superParams}) {
        super({
            ...superParams,
            type: CONSTANTS.WALLET_TYPES.CONTRACT
        });

        this.chaincodeName = chaincodeName;

        if (chaincodeFunctions) {
            this.chaincodeFunctions = chaincodeFunctions;
        }
    }

    txCreatorHasPermissions(txHelper) {
        if (_.isArray(this.chaincodeFunctions)) {

            return this.chaincodeFunctions.some((functionName) => txHelper.invokedByChaincode(this.chaincodeName, functionName));
        }

        return txHelper.invokedByChaincode(this.chaincodeName);
    }

}

module.exports = UserWallet;
