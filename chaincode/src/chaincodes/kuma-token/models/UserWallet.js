const {ChaincodeError, utils} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const AbstractWallet = require('./AbstractWallet');

const CONSTANTS = require('./../common/constants');
const ERRORS = require('./../common/constants/errors');

const logger = utils.logger.getLogger('models/UserWallet');

/**
*   Defines a user wallet. A user is defined by its public key hash.
*   Only a single user can access this wallet.
*/
class UserWallet extends AbstractWallet {

    /**
    *   @param {String} publicKeyHash the public key of a user
    *   Queries the wallet belonging to the given user (public key hash)
    */
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

    /**
    *   Returns the wallet of the caller.
    */
    static async queryCurrentUserWallet(txHelper) {

        // txHelper.getCreatorPublicKey returns the public key hash of the caller
        return UserWallet.queryUserWalletFor(txHelper, txHelper.getCreatorPublicKey());
    }

    /**
    *   The properties of a user wallet contain its owner's public key hash
    */
    get properties() {

        return {
            'publicKeyHash': this.publicKeyHash
        };
    }

    set properties(properties) {
        this.publicKeyHash = properties.publicKeyHash;
    }

    /**
    *   Creates a new user wallet
    *   @param {String} publicKeyHash the public key hash of the owner
    */
    constructor({publicKeyHash, ...superParams}) {
        super({
            ...superParams,
            type: CONSTANTS.WALLET_TYPES.USER
        });

        this.publicKeyHash = publicKeyHash;
    }

    /**
    *   @return true if the caller's public key hash is the publicKeyHash of this wallet
    */
    txCreatorHasPermissions(txHelper) {
        const txCreator = txHelper.getCreatorPublicKey();

        return txCreator === this.publicKeyHash;
    }

}

module.exports = UserWallet;
