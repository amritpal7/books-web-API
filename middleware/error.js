const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = {...err}

    console.log(err);
    
    error.message = err.message;

    // mongoose bad oject ID
    if (err.name === 'CastError') {
        const message = `Resource not found.`;
        error = new ErrorResponse(message, 404);
    }

    // mongoose duplicate key
    if (err.code === 11000) {
        const message = "Duplicate field value is not allowed";
        error = new ErrorResponse(message, 400);
    }

    // mongoose validation error
    if(err.name === 'ValidationError'){
        const message = Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
        
    }
    
    res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Server not found!' })
};

module.exports = errorHandler;