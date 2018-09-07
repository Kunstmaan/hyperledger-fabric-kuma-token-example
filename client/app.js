const express = require('express');
const handleExpressError = require('./utils/express/handleError');
const initApiControllers = require('./controllers/initApiControllers');
const logger = require('./utils/logger').getLogger('app');

const PORT = process.env.PORT || 3000;

const app = express();

app.set('port', PORT);

// MARK: error handling
const handleError = (err, res) => handleExpressError(app, err, res);

// MARK: register controllers
initApiControllers(app);

// MARK: SPA
const createNotFoundError = () => {
    const err = new Error('Not Found');
    err.status = 404;
    return err;
};

app.get('*', (req, res) => {
    const err = createNotFoundError();
    handleError(err, res);
});

app.post('*', (req, res) => {
    const err = createNotFoundError();
    handleError(err, res);
});

app.put('*', (req, res) => {
    const err = createNotFoundError();
    handleError(err, res);
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    handleError(err, res);
});

// MARK: Boot the app
app.listen(PORT, () => {
    logger.info(`Server started http://localhost:${PORT}`);
});
