const shim = require('fabric-shim');
const {ChaincodeBase, ChaincodeError} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const ERRORS = require('./common/constants/errors');
const CONSTANTS = require('./common/constants/index');

const MultisigChaincode = class extends ChaincodeBase {

};

shim.start(new MultisigChaincode());
