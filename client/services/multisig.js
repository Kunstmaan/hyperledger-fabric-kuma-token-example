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
            createMultisigWallet: (userId, publicKeyHashes, signaturesNeeded = undefined) => {
                return invoke({
                    chaincode: {
                        fcn: 'createMultisigWallet',
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
            approveTransfer: (userId, requestId) => {
                return invoke({
                    chaincode: {
                        fcn: 'approveTransfer',
                        args: [requestId]
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
