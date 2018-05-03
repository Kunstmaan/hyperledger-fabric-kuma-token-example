const _ = require('lodash'); // eslint-disable-line

const AbstractWallet = require('./AbstractWallet');

const CONSTANTS = require('./../common/constants');

/**
*   Defines a contract wallet. A contract wallet can only be modified by a chaincode
*   and optionaly only by some of its functions.
*/
class ContractWallet extends AbstractWallet {

    /**
    *   A contract wallet's properties include the owner chaincode,
    *   and its functions
    */
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

    /**
    *   Creates a new contract wallet
    *   @param {String} chaincodeName the name of the chaincode that can spend funds on this wallet
    *   @param {Array} chaincodeFunctions (optional) the specific functions that can spend funds on this wallet
    */
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

    /**
    *   @param {TransactionHelper} txHelper
    *   @return true if the caller is a chaincode with name chaincodeName
    *           If chaincodeFunctions is defined, also checks if the function that calls this is included in the chaincodeFunctions
    */
    txCreatorHasPermissions(txHelper) {
        if (_.isArray(this.chaincodeFunctions)) {
            // Is the caller's function name included in the allowed functions for this contract ?
            return this.chaincodeFunctions.some((functionName) => txHelper.invokedByChaincode(this.chaincodeName, functionName));
        }

        // Is the caller's chaincode name the owner of this contract ?
        return txHelper.invokedByChaincode(this.chaincodeName);
    }

}

module.exports = ContractWallet;
