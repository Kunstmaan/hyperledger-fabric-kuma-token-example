const kumaToken = require('./../services/kuma-token');

module.exports.command = 'ping <chaincode>';
module.exports.describe = 'Ping the given chaincode';

module.exports.handler = function(argv) {
    console.log(`pinging ${argv.chaincode}`);

    switch (argv.chaincode) {
        case 'kuma-token':

            return kumaToken.ping(argv.user);
        case 'multisig':
            console.error('NOT IMPLEMENTED.');
            break;
    }

    return Promise.resolve();
};
