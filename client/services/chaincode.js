const {query, invoke, createFabricClient} = require('@kunstmaan/hyperledger-fabric-client-utils');

const {
    KEYSTORE_PATH, CHANNEL_ID, PEERS, ORDERER
} = require('./../constants');

const logger = require('../utils/logger').getLogger('services/chaincode');

function validateRequiredParams({chaincodeId, chaincodeFunction}) {
    if (!chaincodeId) {
        throw new Error('No chaincodeId param provided.');
    }
    if (!chaincodeFunction) {
        throw new Error('No chaincodeFunction param provided.');
    }
}

function getPeer(peer) {
    const foundPeer = PEERS[peer];
    if (!foundPeer) {
        throw new Error(`Could not find peer ${peer}. Possible peers are ${Object.keys(PEERS)}`);
    }
    return foundPeer;
}

module.exports = {
    query: async ({
        userId = 'admin-kuma',
        chaincodeId,
        channelId = CHANNEL_ID,
        chaincodeFunction,
        chaincodeArgs = [],
        peer = 'KUMA_PEER'
    }) => {
        validateRequiredParams({userId, chaincodeId, chaincodeFunction});
        logger.info(`Executing query for id: ${chaincodeId}, function: ${chaincodeFunction}, args: ${chaincodeArgs}`);
        const fabricClient = await createFabricClient(KEYSTORE_PATH);
        const queryOptions = {
            fabricClient,
            chaincode: {
                id: chaincodeId,
                fcn: chaincodeFunction,
                args: chaincodeArgs
            },
            channelId,
            peer: getPeer(peer),
            userId
        };
        logger.info(`Query options: ${JSON.stringify(queryOptions)}`);
        return query(queryOptions);
    },
    invoke: async ({
        userId = 'admin-kuma',
        chaincodeId,
        channelId = CHANNEL_ID,
        chaincodeFunction,
        chaincodeArgs = [],
        peer = 'KUMA_PEER'
    }) => {
        validateRequiredParams({chaincodeId, chaincodeFunction});
        logger.info(`Executing invoke for id: ${chaincodeId}, function: ${chaincodeFunction}, args: ${chaincodeArgs}`);
        const fabricClient = await createFabricClient(KEYSTORE_PATH);
        const invokeOptions = {
            fabricClient,
            chaincode: {
                id: chaincodeId,
                fcn: chaincodeFunction,
                args: chaincodeArgs
            },
            channelId,
            peers: [getPeer(peer)],
            orderer: ORDERER,
            userId
        };
        logger.info(`Invoke options: ${JSON.stringify(invokeOptions)}`);
        return invoke(invokeOptions);
    }
};
