const _ = require('lodash');

module.exports = function(value) {
    
    return _.isNumber(value) && !_.isNaN(value) && _.isFinite(value)
}