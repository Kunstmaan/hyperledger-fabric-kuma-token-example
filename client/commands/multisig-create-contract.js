const getUserPublicKey = require('./../utils/get-user-public-key');
const multisig = require('./../services/multisig');

module.exports.command = 'multisig-create-contract <users..>';
module.exports.describe = 'Create a multisig contract.';
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
    console.log(`Creating a multisig contract for users [${argv.users}] with ${argv.signaturesNeeded || 'all'} signatures needed.`);

    return Promise.all(argv.users.map((user) => {

        return getUserPublicKey(user);
    })).then((publicKeyHashes) => {
        console.log(`Public key hashes ${JSON.stringify(publicKeyHashes)}`);

        return multisig.createMultisigContract(argv.user, publicKeyHashes, argv.signaturesNeeded).then((multisigContract) => {

            console.log(`Multisig contract ${JSON.stringify(multisigContract)}`);
        });
    });
};
