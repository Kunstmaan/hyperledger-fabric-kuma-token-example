const {baseService} = require('@kunstmaan/hyperledger-fabric-client-utils');

const {
    KEYSTORE_PATH, CHANNEL_ID, PEER, ORDERER
} = require('./../constants');

module.exports = baseService(
    KEYSTORE_PATH,
    'kuma-token',
    (query) => {
        return {
            ping: (userId) => {
                return query({
                    chaincode: {
                        fcn: 'ping',
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
