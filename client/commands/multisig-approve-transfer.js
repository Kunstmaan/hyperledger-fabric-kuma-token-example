const multisig = require('./../services/multisig');

module.exports.command = 'multisig-approve-transfer <requestId>';
module.exports.describe = 'Approve the request to transfer tokens';

module.exports.handler = function(argv) {
    console.log(`Approving multisig transfer ${argv.requestId}`);

    return multisig.approveTransfer(argv.user, argv.requestId).then((request) => {
        console.log(`request ${JSON.stringify(request)}`);
    });
};
