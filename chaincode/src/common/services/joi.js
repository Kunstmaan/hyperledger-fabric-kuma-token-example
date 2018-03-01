const Joi = require('joi');
const {utils} = require('@kunstmaan/hyperledger-fabric-node-chaincode-utils'); // eslint-disable-line

const CONSTANTS = require('../constants');

module.exports = Joi.extend((joi) => ({
    base: joi.string(),
    name: 'string',
    language: {
        walletId: 'needs to be a valid wallet address',
        uuid: 'needs to be a UUID prefixed by "{{p}}"',
        publicKeyHash: 'invalid SHA3 256 publicKey hash'
    },
    rules: [
        {
            name: 'walletId',
            validate(params, value, state, options) {
                const re = new RegExp(`^${CONSTANTS.PREFIXES.WALLET}_[a-z0-9]{64}_[0-9]+$`, 'g');
                const match = value.match(re);

                if (match != null && match.length === 1) {

                    return value;
                }

                return this.createError('string.walletId', {v: value}, state, options);
            }
        },
        {
            name: 'uuid',
            params: {
                p: joi.string()
            },
            validate(params, value, state, options) {
                const re = new RegExp(`^${params.p}_[a-z0-9]{64}_[0-9]+$`, 'g');
                const match = value.match(re);

                if (match != null && match.length === 1) {

                    return value;
                }

                return this.createError('string.uuid', {v: value, p: params.p}, state, options);
            }
        },
        {
            name: 'publicKeyHash',
            validate(params, value, state, options) {
                if (utils.identity.validatePublicKeyHash(value)) {

                    return value;
                }

                return this.createError('string.publicKeyHash', {v: value}, state, options);
            }
        }
    ]
}));
