const multisig = require('./../services/multisig');

module.exports.command = 'multisig-request-transfer <amount> <from> <to>';
module.exports.describe = 'Request the transfer tokens from a multisig wallet to another wallet';
module.exports.builder = {
    'amount': {
        'positional': true,
        'type': 'number',
        'describe': 'the amount to send'
    },
    'from': {
        'positional': true,
        'type': 'string',
        'describe': 'the wallet address to send the tokens from'
    },
    'to': {
        'positional': true,
        'type': 'string',
        'describe': 'the wallet address to send the tokens to'
    }
};

module.exports.handler = function(argv) {
    console.log(`Requesting multisig transfer ${argv.amount} from ${argv.from} to ${argv.to}`);

    return multisig.requestTransfer(argv.user, argv.amount, argv.from, argv.to).then((transferRequest) => {
        console.log(`transfer request ${JSON.stringify(transferRequest)}`);
    });
};
