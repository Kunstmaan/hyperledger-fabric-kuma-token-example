const _ = require('lodash');

module.exports = function(value) {

    return _.isString(value) && value.length > 0;
};
