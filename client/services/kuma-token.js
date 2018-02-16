const {baseService} = require('@kunstmaan/hyperledger-fabric-client-utils');

const {
    KEYSTORE_PATH, CHANNEL_ID, PEER, ORDERER
} = require('./../constants');

module.exports = baseService(
    KEYSTORE_PATH,
    'kuma-token',
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
            retrieveWallet: (userId, address) => {
                return query({
                    chaincode: {
                        fcn: 'retrieveWallet',
                        args: [address]
                    },
                    userId
                });
            },
            retrieveOrCreateWalletFor: (userId) => {
                return invoke({
                    chaincode: {
                        fcn: 'retrieveOrCreateMyWallet',
                        args: []
                    },
                    userId
                });
            },
            transfer: (userId, amount, to, from = undefined) => {
                return invoke({
                    chaincode: {
                        fcn: 'transfer',
                        args: [amount, to, from]
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
