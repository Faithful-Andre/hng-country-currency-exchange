// src/utils/errorHandler.js

// 400 Bad Request: Validation Error
const validationError = (res, details) => {
    res.status(400).json({
        error: "Validation failed",
        details: details
    });
};

// 404 Not Found
const notFoundError = (res, message = "Country not found") => {
    res.status(404).json({
        error: message
    });
};

// 503 Service Unavailable: External API Failure (CRITICAL FIX for refresh logic)
const serviceUnavailableError = (res, apiName) => {
    res.status(503).json({
        error: "External data source unavailable",
        details: `Could not fetch data from ${apiName}`
    });
};

module.exports = { validationError, notFoundError, serviceUnavailableError };