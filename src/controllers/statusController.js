// src/controllers/statusController.js
const { query } = require('../config/db');

exports.getStatus = async (req, res, next) => {
    try {
        const [statusRecord] = await query("SELECT total_countries, last_refreshed_at FROM status WHERE id = 1");
        
        // Format date to ISO string ending in 'Z' (e.g., "2025-10-22T18:00:00Z")
        const lastRefreshedAt = statusRecord.last_refreshed_at 
            ? statusRecord.last_refreshed_at.toISOString().replace(/\.000Z$/, 'Z')
            : null;

        res.json({
            total_countries: statusRecord.total_countries,
            last_refreshed_at: lastRefreshedAt
        });
    } catch (error) {
        // Pass error to the global 500 handler
        next(error); 
    }
};