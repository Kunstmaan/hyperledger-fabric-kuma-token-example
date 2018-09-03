const shim = require('fabric-shim'); // eslint-disable-line
const {ChaincodeBase, TransactionHelper, ChaincodeError} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const ERRORS = require('./common/constants/errors');
const CONSTANTS = require('./common/constants/index');

const Joi = require('./common/services/joi');

/**
*   Defines behavior of
*/
const MultisigChaincode = class extends ChaincodeBase {

    /**
     * Creates a contract that is owned by this chaincode, and that can only spend
     * funds given a sufficient number of signatures from its owners
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {Array} publicKeyHashes The public key hashes that are needed to sign a transaction on this contract
     * @param {Int} signaturesNeeded (optional) Number of signatures needed. Defaults to all signatures
     */
    async createMultisigContract(stub, txHelper, publicKeyHashes, signaturesNeeded) {
        // Create a schema to validate the user input
        const schema = Joi.object().keys({
            publicKeyHashes: Joi.array().required().items(Joi.string().publicKeyHash()).min(2),
            signaturesNeeded: Joi.number().optional().integer().positive()
        });

        try {
            // Validate the user input
            await schema.validate({
                publicKeyHashes,
                signaturesNeeded
            });

            await Joi.number().optional()
                .max(publicKeyHashes.length)
                .label('signaturesNeeded')
                .validate(signaturesNeeded);
        } catch (error) {
            // Throw a validation error if arguments are not correct
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        /**
        *   This calls another chaincode's function.
        *   It creates a contract wallet using the kuma-token chaincode,
        *   Defines this chaincode as the owner, and only the
        *   requestTransfer and approveTransfer
        *   functions can make changes on this contract
        */
        const multisigWallet = await txHelper.invokeChaincode(
            CONSTANTS.CHAINCODES.KUMA_TOKEN,
            'createContractWallet',
            [CONSTANTS.CHAINCODES.MULTISIG, ['requestTransfer', 'approveTransfer']]
        );

        /**
        *   This creates a multisigContract, with the publicKeyHashes of the owners,
        *   and the contract wallet's address created just before
        */
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
     * Requests a transfer on the
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {Float} amount the coins to transfer from wallet id fromAddress to wallet id toAddress
     * @param {String} fromAddress the address of the multisigWallet or the multisigContract that should send the coins.
     * @param {String} toAddress the address of the wallet that should receive the coins
     */
    async requestTransfer(stub, txHelper, amount, fromAddress, toAddress) {
        // Create a schema to validate the user input
        const schema = Joi.object().keys({
            amount: Joi.number().required().positive(),
            fromAddress: Joi.alternatives().try(
                Joi.string().required().walletId(),
                Joi.string().required().uuid(CONSTANTS.PREFIXES.MULTISIG)
            ),
            toAddress: Joi.string().required().walletId()
        });

        try {
            // Validate the user input
            await schema.validate({
                amount,
                fromAddress,
                toAddress
            });
        } catch (error) {
            // Throw a validation error if arguments are not correct
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

        /*
        *   Create a transfer request, marking the caller's public
        *   key as a first signature for the transfer
        */
        const multisigTransferRequest = {
            'id': txHelper.uuid(CONSTANTS.PREFIXES.MULTISIG_REQUEST), // Creates a new unique id
            'contract': fromContract.address,
            'transaction': {
                'amount': amount,
                'toAddress': toAddress
            },
            'executed': false,
            'approvals': [txHelper.getCreatorPublicKey()]
        };

        /**
        *   Check if the number of signatures is already enough, and if so call the
        *   kuma-token chaincode to execute the transfer
        */
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

        // Save the transfer request on the blockchain
        await txHelper.putState(multisigTransferRequest.id, multisigTransferRequest);

        // And return it
        return multisigTransferRequest;
    }

    /**
     * Retrieves a multisigTransferRequest from its id
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {String} transferId the id of the transaction request
     */
    async getTransfer(stub, txHelper, transferId) {
        // Create a schema to validate the user input
        const schema = Joi.object().keys({
            transferId: Joi.string().required().uuid(CONSTANTS.PREFIXES.MULTISIG_REQUEST)
        });

        try {
            // Validate the user input
            await schema.validate({
                transferId
            });
        } catch (error) {
            // Throw a validation error if arguments are not correct
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        // Retrieve the wallet from the blockchain
        const multisigTransferRequest = await txHelper.getStateAsObject(transferId);

        // Return it
        return multisigTransferRequest;
    }

    /**
     * Add the caller's signature to the transfer request with id transferId
     * @param {Stub} stub
     * @param {TransactionHelper} txHelper
     * @param {String} transferId the id of the transaction request
     */
    async approveTransfer(stub, txHelper, transferId) {
        // Create a schema to validate the user input
        const schema = Joi.object().keys({
            transferId: Joi.string().required().uuid(CONSTANTS.PREFIXES.MULTISIG_REQUEST)
        });

        try {
            // Validate the user input
            await schema.validate({
                transferId
            });
        } catch (error) {
            // Throw a validation error if arguments are not correct
            throw new ChaincodeError(ERRORS.VALIDATION, {
                'message': error.message,
                'details': error.details
            });
        }

        // Get the transfer from the blockchain
        const multisigTransferRequest = await txHelper.getStateAsObject(transferId);

        if (!multisigTransferRequest) {

            throw new ChaincodeError(ERRORS.UNKNOWN_ENTITY, {
                'transferId': transferId
            });
        }

        // Get the creator's public key
        const creatorPublicKey = txHelper.getCreatorPublicKey();

        // Get the multisigContract from the address of the contract in the transfer request
        const contract = await txHelper.getStateAsObject(multisigTransferRequest.contract);

        // Is the caller part of the authorized owners of the contract ?
        if (!contract.publicKeyHashes.includes(creatorPublicKey)) {

            throw new ChaincodeError(ERRORS.NOT_PERMITTED, {
                'publicKeyHash': creatorPublicKey
            });
        }

        // Is the transfer already executed ?
        if (multisigTransferRequest.executed) {

            throw new ChaincodeError(ERRORS.TRANSFER_ALREADY_EXECUTED, {
                'transferId': transferId
            });
        }

        // Did the caller already approve the transfer ?
        if (multisigTransferRequest.approvals.includes(creatorPublicKey)) {

            throw new ChaincodeError(ERRORS.TRANSFER_ALREADY_APPROVED, {
                'transferId': transferId
            });
        }

        // Add the caller's signature to the transfer
        multisigTransferRequest.approvals.push(creatorPublicKey);

        // If the number of needed signatures is reached, proceed with the transfer by calling the kuma-token chaincode
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

        // Save the transfer state to the blockchain
        await txHelper.putState(multisigTransferRequest.id, multisigTransferRequest);

        // Return the transfer request
        return multisigTransferRequest;
    }

};

shim.start(new MultisigChaincode(shim));
