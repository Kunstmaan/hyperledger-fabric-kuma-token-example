const kumaToken = require('./../services/kuma-token');

module.exports.command = 'wallet';
module.exports.describe = 'Query the wallet for the given user';
module.exports.builder = {
    'user': {
        'alias': 'u',
        'type': 'string',
        'describe': 'The user which should execute this command.',
        'default': 'user-1'
    }
};

module.exports.handler = function(argv) {
    console.log(`Querying wallet for ${argv.user}`);

    return kumaToken.retrieveOrCreateWalletFor(argv.user).then((wallet) => {
        console.log(`Wallet: ${JSON.stringify(wallet)}`);
    });
};
