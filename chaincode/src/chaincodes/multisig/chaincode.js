const shim = require('fabric-shim');
const {ChaincodeBase, TransactionHelper, ChaincodeError} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const ERRORS = require('./common/constants/errors');
const CONSTANTS = require('./common/constants/index');

const Joi = require('./common/services/joi');

const MultisigChaincode = class extends ChaincodeBase {

    /**
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {Array} publicKeyHashes
     * @param {Int} signaturesNeeded (optional) default all signatures
     */
    async createMultisigContract(stub, txHelper, publicKeyHashes, signaturesNeeded) {
        const schema = Joi.object().keys({
            publicKeyHashes: Joi.array().required().items(Joi.string().publicKeyHash()).min(2),
            signaturesNeeded: Joi.number().optional().integer().positive()
        });

        try {
            await schema.validate({
                publicKeyHashes,
                signaturesNeeded
            });

            await Joi.number().optional()
                .max(publicKeyHashes.length)
                .label('signaturesNeeded')
                .validate(signaturesNeeded);
        } catch (error) {
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        const multisigWallet = await txHelper.invokeChaincode(
            CONSTANTS.CHAINCODES.KUMA_TOKEN,
            'createContractWallet',
            [CONSTANTS.CHAINCODES.MULTISIG, ['requestTransfer', 'approveTransfer']]
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
        const schema = Joi.object().keys({
            amount: Joi.number().required().positive(),
            fromAddress: Joi.alternatives().try(
                Joi.string().required().walletId(),
                Joi.string().required().uuid(CONSTANTS.PREFIXES.MULTISIG)
            ),
            toAddress: Joi.string().required().walletId()
        });

        try {
            await schema.validate({
                amount,
                fromAddress,
                toAddress
            });
        } catch (error) {
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        // from address can be the address of the wallet or the address of the contract
        let fromContract = await txHelper.getStateAsObject(fromAddress);
        if (!fromContract) {
            // maybe it's a wallet address
            const results = await txHelper.getQueryResultAsList({
                'selector': {
                    'walletAddress': fromAddress
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
            await txHelper.invokeChaincode(
                CONSTANTS.CHAINCODES.KUMA_TOKEN,
                'transfer',
                [
                    multisigTransferRequest.transaction.amount,
                    multisigTransferRequest.transaction.toAddress,
                    fromContract.walletAddress
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
     * @param {String} transferId the id of the transaction request
     */
    async getTransfer(stub, txHelper, transferId) {
        const schema = Joi.object().keys({
            transferId: Joi.string().required().uuid(CONSTANTS.PREFIXES.MULTISIG_REQUEST)
        });

        try {
            await schema.validate({
                transferId
            });
        } catch (error) {
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        const multisigTransferRequest = await txHelper.getStateAsObject(transferId);

        return multisigTransferRequest;
    }

    /**
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {String} transferId the id of the transaction request
     */
    async approveTransfer(stub, txHelper, transferId) {
        const schema = Joi.object().keys({
            transferId: Joi.string().required().uuid(CONSTANTS.PREFIXES.MULTISIG_REQUEST)
        });

        try {
            await schema.validate({
                transferId
            });
        } catch (error) {
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        const multisigTransferRequest = await txHelper.getStateAsObject(transferId);

        if (!multisigTransferRequest) {

            throw new ChaincodeError(ERRORS.UNKNOWN_ENTITY, {
                'transferId': transferId
            });
        }

        const creatorPublicKey = txHelper.getCreatorPublicKey();
        const contract = await txHelper.getStateAsObject(multisigTransferRequest.contract);

        if (!contract.publicKeyHashes.includes(creatorPublicKey)) {

            throw new ChaincodeError(ERRORS.NOT_PERMITTED, {
                'publicKeyHash': creatorPublicKey
            });
        }

        if (multisigTransferRequest.executed) {

            throw new ChaincodeError(ERRORS.TRANSFER_ALREADY_EXECUTED, {
                'transferId': transferId
            });
        }

        if (multisigTransferRequest.approvals.includes(creatorPublicKey)) {

            throw new ChaincodeError(ERRORS.TRANSFER_ALREADY_APPROVED, {
                'transferId': transferId
            });
        }

        multisigTransferRequest.approvals.push(creatorPublicKey);

        if (multisigTransferRequest.approvals.length >= contract.signaturesNeeded) {
            await txHelper.invokeChaincode(
                CONSTANTS.CHAINCODES.KUMA_TOKEN,
                'transfer',
                [
                    multisigTransferRequest.transaction.amount,
                    multisigTransferRequest.transaction.toAddress,
                    contract.walletAddress
                ]
            );

            multisigTransferRequest.executed = true;
        }

        await txHelper.putState(multisigTransferRequest.id, multisigTransferRequest);

        return multisigTransferRequest;
    }

};

shim.start(new MultisigChaincode(shim));
