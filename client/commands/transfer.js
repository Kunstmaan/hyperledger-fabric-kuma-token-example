module.exports.command = 'transfer';
module.exports.describe = 'Transfer tokens for one address to another';

module.exports.handler = function() {
    console.log('executing transfer');

    return Promise.resolve();
};