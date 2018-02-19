const path = require('path');
const fs = require('fs-extra');
const {utils} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils');

const CONSTANTS = require('./../constants');

module.exports = function(name) {

    return fs.readFile(path.resolve(CONSTANTS.KEYSTORE_PATH, name)).then((userConfigRaw) => {
        const userConfig = JSON.parse(userConfigRaw);
        const {certificate} = userConfig.enrollment.identity;

        return utils.identity.getPublicKeyHashFromPEM(certificate);
    });
};
