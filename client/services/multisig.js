const {baseService} = require('@kunstmaan/hyperledger-fabric-client-utils');

const {
    KEYSTORE_PATH, CHANNEL_ID, PEER, ORDERER
} = require('./../constants');

module.exports = baseService(
    KEYSTORE_PATH,
    'multisig',
    (query, invoke) => {
        return {
            ping: (userId) => {
                return query({
                    chaincode: {
                        fcn: 'ping',
                        args: []
                    },
                    userId
                });
            },
            createMultisigContract: (userId, publicKeyHashes, signaturesNeeded = undefined) => {
                return invoke({
                    chaincode: {
                        fcn: 'createMultisigContract',
                        args: [publicKeyHashes, signaturesNeeded]
                    },
                    userId
                });
            },
            requestTransfer: (userId, amount, from, to) => {
                return invoke({
                    chaincode: {
                        fcn: 'requestTransfer',
                        args: [amount, from, to]
                    },
                    userId
                });
            },
            getTransfer: (userId, transferId) => {
                return invoke({
                    chaincode: {
                        fcn: 'getTransfer',
                        args: [transferId]
                    },
                    userId
                });
            },
            approveTransfer: (userId, transferId) => {
                return invoke({
                    chaincode: {
                        fcn: 'approveTransfer',
                        args: [transferId]
                    },
                    userId
                });
            }
        };
    },
    {
        channelId: CHANNEL_ID,
        peers: [PEER],
        orderer: ORDERER
    }
);
