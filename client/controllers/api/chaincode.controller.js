const apiController = require('../api.controller');
const throwError = require('../../utils/express/throwError');
const {invoke, query} = require('../../services/chaincode');

function convertArgs(chaincodeArg) {
    if (typeof chaincodeArg === 'string') {
        return [chaincodeArg];
    }
    if (Array.isArray(chaincodeArg)) {
        return chaincodeArg;
    }
    return chaincodeArg;
}

module.exports = (apiRouter) => apiController({path: '/chaincode', isSecure: false})(apiRouter, (router) => {
    router.get('/query', (req, res) => {
        const {
            userId, chaincodeId,
            chaincodeFunction, chaincodeArg, channelId, peer
        } = req.query;

        return query({
            userId,
            channelId,
            chaincodeId,
            chaincodeFunction,
            chaincodeArgs: convertArgs(chaincodeArg),
            peer
        })
            .then((result) => res.json(result))
            .catch((err) => throwError(err.status || 400, err, res));
    });

    router.get('/invoke', (req, res) => {
        const {
            userId, chaincodeId,
            chaincodeFunction, chaincodeArg, channelId, peer
        } = req.query;

        return invoke({
            userId,
            channelId,
            chaincodeId,
            chaincodeFunction,
            chaincodeArgs: convertArgs(chaincodeArg),
            peer
        })
            .then((result) => res.json(result))
            .catch((err) => throwError(err.status || 400, err, res));
    });
});
