const multisig = require('./../services/multisig');

module.exports.command = 'multisig-request-transfer <amount> <from> <to>';
module.exports.describe = 'Request the transfer tokens from a multisig wallet to another wallet';

module.exports.handler = function(argv) {
    console.log(`Requesting multisig transfer ${argv.amount} from ${argv.from} to ${argv.to}`);

    return multisig.requestTransfer(argv.user, argv.amount, argv.from, argv.to).then((request) => {
        console.log(`request ${JSON.stringify(request)}`);
    });
};
