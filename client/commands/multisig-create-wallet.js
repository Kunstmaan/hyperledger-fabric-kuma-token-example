const path = require('path');
const fs = require('fs-extra');
const {utils} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils');

const multisig = require('./../services/multisig');
const CONSTANTS = require('./../constants');

module.exports.command = 'multisig-create-wallet <users..>';
module.exports.describe = 'Create a multisig wallet.';
module.exports.builder = {
    'signaturesNeeded': {
        'alias': 's',
        'type': 'number'
    },
    'users': {
        'type': 'array'
    }
};

module.exports.handler = function(argv) {
    console.log(`Creating a multisig wallet for users [${argv.users}] with ${argv.signaturesNeeded || 'all'} signatures needed.`);

    return Promise.all(argv.users.map((user) => {

        return fs.readFile(path.resolve(CONSTANTS.KEYSTORE_PATH, user)).then((userConfigRaw) => {
            const userConfig = JSON.parse(userConfigRaw);
            const {certificate} = userConfig.enrollment.identity;

            return utils.identity.getPublicKeyHashFromPEM(certificate);
        });
    })).then((publicKeyHashes) => {
        console.log(`Public key hashes ${JSON.stringify(publicKeyHashes)}`);

        return multisig.createMultisigWallet(argv.user, publicKeyHashes, argv.signaturesNeeded).then((multisigWallet) => {

            console.log(`Multisig wallet ${JSON.stringify(multisigWallet)}`);
        });
    });
};
