const commandExists = require('command-exists');
const {exec} = require('child_process');
const path = require('path');

module.exports.command = 'create-user <name>';
module.exports.describe = 'Create a new user';

module.exports.handler = function(argv) {
    console.log(`Creating user ${argv.name}`);

    return commandExists('kuma-hf-network').catch(() => {

        throw new Error('make sure kuma-hf-network is installed https://github.com/Kunstmaan/hyperledger-fabric-network-setup');
    }).then(() => {

        return new Promise((fulfill, reject) => {

            exec(`kuma-hf-network generate-user ${argv.name} KunstmaanAuth ./configuration/crypto_config-kuma.yaml --attributes name=${argv.name}`, {
                cwd: path.resolve(__dirname, '../../network'),
                env: process.env,
                encoding: 'utf8',
                stdio: 'inherit'
            }, (error, stdout, stderr) => {
                if (error) {
                    console.error(stderr);
                    reject(error);
                    return;
                }

                console.log(stdout);
                fulfill();
            });
        });
    });
};
