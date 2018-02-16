const {ChaincodeError, utils} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils');

const AbstractWallet = require('./AbstractWallet');

const CONSTANTS = require('./../common/constants');
const ERRORS = require('./../common/constants/errors');

const logger = utils.logger.getLogger('models/UserWallet');

class UserWallet extends AbstractWallet {

    static async queryUserWalletFor(txHelper, publicKeyHash) {
        const wallets = await AbstractWallet.queryWallets(txHelper, CONSTANTS.WALLET_TYPES.USER, {
            'properties': {
                'publicKeyHash': publicKeyHash
            }
        });

        logger.debug(JSON.stringify(wallets));

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

        return UserWallet.queryUserWalletFor(txHelper, txHelper.getCreatorPublicKey());
    }

    get properties() {

        return {
            'publicKeyHash': this.publicKeyHash
        };
    }

    set properties(properties) {
        this.publicKeyHash = properties.publicKeyHash;
    }

    constructor({publicKeyHash, ...superParams}) {
        super({
            ...superParams,
            type: CONSTANTS.WALLET_TYPES.USER
        });

        this.publicKeyHash = publicKeyHash;
    }

    txCreatorHasPermissions(txHelper) {
        const txCreator = txHelper.getCreatorPublicKey();

        return txCreator === this.publicKeyHash;
    }

}

module.exports = UserWallet;
