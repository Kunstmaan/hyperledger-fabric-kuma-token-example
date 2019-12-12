const express = require('express');
module.exports = function api({path, isSecure = false}) {
    const router = express.Router();

    return function(apiRouter, actions) {
        actions(router);
        apiRouter.use(path, router);
    };
};
