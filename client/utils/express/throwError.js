const createError = require('../error/createError');

module.exports = function throwError(statusCode, err, res = null) {
    let errObj;
    if (typeof err === 'string') {
        errObj = createError(statusCode, err);
    } else {
        errObj = err;
    }

    if (res) {
        res.status(statusCode);
        return res.json({
            message: errObj.message,
            error: errObj
        });
    }
    throw errObj;
};
