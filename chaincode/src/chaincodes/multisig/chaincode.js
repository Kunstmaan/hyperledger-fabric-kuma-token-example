const shim = require('fabric-shim');
const {ChaincodeBase, TransactionHelper, ChaincodeError} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const ERRORS = require('./common/constants/errors');
const CONSTANTS = require('./common/constants/index');

const isFloat = require('./common/validators/isFloat');
const isUUID = require('./common/validators/isUUID');
const isInt = require('./common/validators/isInt');
const isArray = require('./common/validators/isArray');
const isPublicKeyHash = require('./common/validators/isPublicKeyHash');

const MultisigChaincode = class extends ChaincodeBase {

    /**
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {Array} publicKeyHashes
     * @param {Int} signaturesNeeded (optional) default all signatures
     */
    async createMultisigWallet(stub, txHelper, publicKeyHashes, signaturesNeeded) {
        if (!isArray(publicKeyHashes) || publicKeyHashes.length === 0) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'publicKeyHashes',
                'value': publicKeyHashes,
                'expected': 'not empty array'
            });
        }

        if (!publicKeyHashes.every((publicKeyHash) => isPublicKeyHash(publicKeyHash))) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'publicKeyHashes',
                'value': publicKeyHashes,
                'expected': 'public key hash'
            });
        }

        if (signaturesNeeded && (!isInt(signaturesNeeded) || signaturesNeeded > publicKeyHashes.length)) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'signaturesNeeded',
                'value': signaturesNeeded,
                'expected': `integer max value ${publicKeyHashes.length}`
            });
        }

        const multisigWallet = await txHelper.invokeChaincode(
            CONSTANTS.CHAINCCODES.KUMA_TOKEN,
            'createContractWallet',
            [CONSTANTS.CHAINCCODES.MULTISIG, ['requestTransfer', 'approveTransfer']]
        );

        const multisigContract = {
            'address': txHelper.uuid(CONSTANTS.PREFIXES.MULTISIG),
            'walletAddress': multisigWallet.address,
            'publicKeyHashes': publicKeyHashes,
            'signaturesNeeded': signaturesNeeded || publicKeyHashes.length
        };

        await txHelper.putState(multisigContract.address, multisigContract);

        return multisigContract;
    }

    /**
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {Float} amount the coins to transfer from wallet id fromAddress to wallet id toAddress
     * @param {String} fromAddress the address of the wallet or the contract that should send the coins.
     * @param {String} toAddress the address of the wallet that should receive the coins
     */
    async requestTransfer(stub, txHelper, amount, fromAddress, toAddress) {
        if (!isFloat(amount) || amount < 0) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'amount',
                'value': amount,
                'expected': 'positive float'
            });
        }

        if (!isUUID(CONSTANTS.PREFIXES.WALLET, fromAddress) && !isUUID(CONSTANTS.PREFIXES.MULTISIG, fromAddress)) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'fromAddress',
                'value': fromAddress,
                'expected': 'address'
            });
        }

        if (!isUUID(CONSTANTS.PREFIXES.WALLET, toAddress)) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'toAddress',
                'value': toAddress,
                'expected': 'address'
            });
        }

        // from address can be the address of the wallet or the address of the contract
        let fromContract = await txHelper.getStateAsObject(fromAddress);
        if (!fromContract) {
            // maybe it's a wallet address
            const results = txHelper.getQueryResultAsList({
                '$selector': {
                    'wallet': fromAddress
                }
            });

            if (results.length === 0) {

                throw new ChaincodeError(ERRORS.UNKNOWN_ENTITY, {
                    'address': fromAddress
                });
            }

            fromContract = results[0].record;
        }

        const multisigTransferRequest = {
            'id': txHelper.uuid(CONSTANTS.PREFIXES.MULTISIG_REQUEST),
            'contract': fromContract.address,
            'transaction': {
                'amount': amount,
                'toAddress': toAddress
            },
            'executed': false,
            'approvals': [txHelper.getCreatorPublicKey()]
        };

        if (multisigTransferRequest.approvals.length >= fromContract.signaturesNeeded) {
            await await txHelper.invokeChaincode(
                CONSTANTS.CHAINCCODES.KUMA_TOKEN,
                'transfer',
                [
                    multisigTransferRequest.transaction.amount,
                    multisigTransferRequest.transaction.toAddress,
                    fromContract.wallet
                ]
            );

            multisigTransferRequest.executed = true;
        }

        await txHelper.putState(multisigTransferRequest.id, multisigTransferRequest);

        return multisigTransferRequest;
    }

    /**
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {String} requestId the id of the transaction request
     */
    async approveTransfer(stub, txHelper, requestId) {
        if (!isUUID(CONSTANTS.PREFIXES.MULTISIG_REQUEST, requestId)) {

            throw new ChaincodeError(ERRORS.TYPE_ERROR, {
                'param': 'requestId',
                'value': requestId,
                'expected': 'multisig request id'
            });
        }

        const multisigTransferRequest = await txHelper.getStateAsObject(requestId);

        if (!multisigTransferRequest) {

            throw new ChaincodeError(ERRORS.UNKNOWN_ENTITY, {
                'requestId': requestId
            });
        }

        if (multisigTransferRequest.executed) {

            throw new ChaincodeError(ERRORS.TRANSFER_ALREADY_EXECUTED, {
                'requestId': requestId
            });
        }

        const creatorPublicKey = txHelper.getCreatorPublicKey();
        if (multisigTransferRequest.approvals.includes(creatorPublicKey)) {

            throw new ChaincodeError(ERRORS.TRANSFER_ALREADY_APPROVED, {
                'requestId': requestId
            });
        }

        multisigTransferRequest.approvals.push(creatorPublicKey);

        const contract = await txHelper.getStateAsObject(multisigTransferRequest.contract);
        if (multisigTransferRequest.approvals.length >= contract.signaturesNeeded) {
            await await txHelper.invokeChaincode(
                CONSTANTS.CHAINCCODES.KUMA_TOKEN,
                'transfer',
                [
                    multisigTransferRequest.transaction.amount,
                    multisigTransferRequest.transaction.toAddress,
                    contract.wallet
                ]
            );

            multisigTransferRequest.executed = true;
        }

        await txHelper.putState(multisigTransferRequest.id, multisigTransferRequest);

        return multisigTransferRequest;
    }

};

shim.start(new MultisigChaincode());
