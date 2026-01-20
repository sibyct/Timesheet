// middleware/errorHandler.js

/**
 * 404 Not Found handler
 */
function notFound(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
}

/**
 * General error handling middleware
 * Sends JSON response with error message.
 */
function errorHandler(err, req, res, next) {
    // In production you might hide stack traces
    res.status(err.status || 500);
    res.json({
        message: err.message,
        // Do not expose internal error details
        error: {}
    });
}

module.exports = {
    notFound,
    errorHandler,
};
