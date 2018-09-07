const log4js = require('log4js');

module.exports.getLogger = (name) => {
    const logger = log4js.getLogger(name);

    // set the logging level based on the environment variable
    const level = process.env.APP_LOGGING_LEVEL;
    let loglevel = 'info';
    if (typeof level === 'string') {
        switch (level.toUpperCase()) {
            case 'CRITICAL':
                loglevel = 'fatal';
                break;
            case 'ERROR':
                loglevel = 'error';
                break;
            case 'WARNING':
                loglevel = 'warn';
                break;
            case 'DEBUG':
                loglevel = 'debug';
        }
    }

    logger.level = loglevel;

    return logger;
};
