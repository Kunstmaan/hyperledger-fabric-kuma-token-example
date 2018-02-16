const kumaToken = require('./../services/kuma-token');

module.exports.command = 'wallet [address]';
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
    console.log(`Querying wallet ${argv.address ? `with address ${argv.address}` : ` for user ${argv.user}`}`);

    if (argv.address) {

        return kumaToken.retrieveWallet(argv.user, argv.address);
    }

    return kumaToken.retrieveOrCreateWalletFor(argv.user).then((wallet) => {
        console.log(`Wallet: ${JSON.stringify(wallet)}`);
    });
};
