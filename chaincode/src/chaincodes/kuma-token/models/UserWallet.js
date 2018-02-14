const {ChaincodeError} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils');

const AbstractWallet = require('./AbstractWallet');

const CONSTANTS = require('./../common/constants');
const ERRORS = require('./../common/constants/errors');

class UserWallet extends AbstractWallet {

    static async queryUserWalletFor(txHelper, publicKeyHash) {
        const wallets = AbstractWallet.queryWallets(txHelper, {
            'properties': {
                'publicKeyHash': publicKeyHash
            }
        });

        if (wallets.length === 0) {

            return undefined;
        } else if (wallets.length === 1) {

            return wallets[0];
        }

        throw new ChaincodeError(ERRORS.MULTIPLE_WALLETS_FOUND_FOR_USER, {
            'publicKeyHash': publicKeyHash
        });
    }

    static async queryCurrentUserWallet(txHelper) {

        return UserWallet.userWalletFor(txHelper, txHelper.getCreatorPublicKey());
    }

    get properties() {

        return {
            'publicKeyHash': this.publicKeyHash
        };
    }

    constructor({publicKeyHash, ...superParams}) {
        super({
            ...superParams,
            type: CONSTANTS.WALLET_TYPES.USER
        });

        this.publicKeyHash = publicKeyHash;
    }

    txCreatorHasPermissions(txHelper) {
        const txCreator = txHelper.getCreatorPublicKey;

        return txCreator === this.publicKeyHash;
    }

}

module.exports = UserWallet;
