const kumaToken = require('./../services/kuma-token');

module.exports.command = 'wallet <user>';
module.exports.describe = 'Query the wallet for the given user';

module.exports.handler = function(argv) {
    console.log(`Querying wallet for ${argv.user}`);

    return kumaToken.retrieveOrCreateWalletFor(argv.user).then((wallet) => {
        console.log(`Wallet: ${JSON.stringify(wallet)}`);
    });
};
