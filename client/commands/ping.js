const kumaToken = require('./../services/kuma-token');

module.exports.command = 'ping <chaincode>';
module.exports.describe = 'Ping the given chaincode';

module.exports.handler = function(argv) {
    console.log(`pinging ${argv.chaincode}`);

    switch (argv.chaincode) {
        case 'kuma-token':

            return kumaToken.ping('user-1');
        case 'multisig':
            console.error('NOT IMPLEMENTED.');
            break;
    }

    return Promise.resolve();
};
