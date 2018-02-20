const kumaToken = require('./../services/kuma-token');

module.exports.command = 'transfer <amount> <to> [from]';
module.exports.describe = 'Transfer tokens for one address to another';
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
    console.log(`executing transfer ${argv.amount} to ${argv.to} from ${argv.from || argv.user}`);

    return kumaToken.transfer(argv.user, argv.amount, argv.to, argv.from).then((wallets) => {
        console.log(`updated wallets ${JSON.stringify(wallets)}`);
    });
};
