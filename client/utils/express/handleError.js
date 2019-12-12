module.exports = function handleError(app, err, res) {
    res.status(err.status || 500);
    if (app.get('env') === 'development') {
        // development error handler
        // will print stacktrace
        res.json({
            message: err.message,
            error: err
        });
    } else {
        // production error handler
        // no stacktraces leaked to user
        res.json({
            message: err.message,
            error: {}
        });
    }
};
