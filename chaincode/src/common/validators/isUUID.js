const _ = require('lodash');

module.exports = function(prefix, value) {
    if (_.isNil(value)) {

        return false;
    }

    const re = new RegExp(`^${prefix}_[a-z0-9]{64}_[0-9]+$`, 'g');
    const match = value.match(re);

    return !_.isNil(match) && match.length === 1;
};
