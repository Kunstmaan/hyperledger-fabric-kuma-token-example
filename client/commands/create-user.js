module.exports.command = 'create-user <name>';
module.exports.describe = 'Create a new user';

module.exports.handler = function(argv) {
    console.log(`Creating user ${argv.name}`);

    return Promise.resolve();
};
