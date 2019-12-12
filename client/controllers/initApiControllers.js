const express = require('express');
const fs = require('fs');
const path = require('path');

module.exports = function initApiControllers(app) {
    const apiRouter = express.Router();

    const apiPath = path.resolve(__dirname, './api');
    fs.readdir(apiPath, (err, files) => {
        if (err) {
            throw new Error(`Failed to initialize api controllers: ${err.message}`);
        }
        files.forEach((file) => {
            require(path.join(apiPath, file))(apiRouter);
        });
    });

    app.use('/api', apiRouter);
};
