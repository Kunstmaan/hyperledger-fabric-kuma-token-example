const multisig = require('./../services/multisig');

module.exports.command = 'multisig-approve-transfer <transferId>';
module.exports.describe = 'Get information about the given transferId';

module.exports.handler = function(argv) {
    console.log(`Getting info multisig transfer ${argv.transferId}`);

    return multisig.getTransfer(argv.user, argv.transferId).then((transferRequest) => {
        console.log(`transfer request ${JSON.stringify(transferRequest)}`);
    });
};
