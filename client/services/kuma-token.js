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
            retrieveOrCreateWalletFor: (userId) => {
                return invoke({
                    chaincode: {
                        fcn: 'retrieveOrCreateMyWallet',
                        args: []
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
