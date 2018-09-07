module.exports = function createError(statusCode, message, key = undefined, data = {}) {
    const err = new Error(message);
    err.status = statusCode;
    err.key = key;
    err.data = data;
    return err;
};
