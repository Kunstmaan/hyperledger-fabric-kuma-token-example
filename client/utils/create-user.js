const commandExists = require('command-exists');
const {exec} = require('child_process');
const path = require('path');

module.exports = function({name, verbose = false}) {

    return commandExists('kuma-hf-network').catch(() => {

        throw new Error('make sure kuma-hf-network is installed, see: https://github.com/Kunstmaan/hyperledger-fabric-network-setup');
    }).then(() => {

        return new Promise((fulfill, reject) => {

            exec(`kuma-hf-network generate-user ${name} KunstmaanAuth ./configuration/crypto_config-kuma.yaml --attributes name=${name}`, {
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

                if (verbose) {
                    console.log(stdout);
                }
                fulfill();
            });
        });
    });
};
