// src/controllers/countryController.js
const refreshService = require('../services/refreshService');
const imageGenerator = require('../services/imageGenerator'); // For serving image
const { query } = require('../config/db');
const { notFoundError } = require('../utils/errorHandler');

// Helper to format DB output timestamp to ISO format
const formatCountryResponse = (country) => {
    return {
        ...country,
        population: parseInt(country.population),
        exchange_rate: country.exchange_rate ? parseFloat(country.exchange_rate) : null,
        estimated_gdp: country.estimated_gdp ? parseFloat(country.estimated_gdp) : null,
        last_refreshed_at: new Date(country.last_refreshed_at).toISOString().replace(/\.000Z$/, 'Z'),
    };
};

// POST /countries/refresh
exports.refreshData = async (req, res, next) => {
    try {
        // Service handles the response/errors internally
        await refreshService.refreshData(res);
    } catch (error) {
        next(error); 
    }
};

// GET /countries (Filtering and Sorting - FIXES TEST 2)
exports.getAllCountries = async (req, res, next) => {
    try {
        const { region, currency, sort } = req.query;
        let whereClauses = [];
        let queryParams = [];

        // Filtering
        if (region) {
            whereClauses.push("region = ?");
            queryParams.push(region);
        }
        if (currency) {
            whereClauses.push("currency_code = ?");
            queryParams.push(currency.toUpperCase());
        }

        let sql = "SELECT * FROM countries";
        if (whereClauses.length > 0) {
            sql += " WHERE " + whereClauses.join(" AND ");
        }

        // Sorting (CRITICAL: GDP descending required)
        let orderBy = "name ASC"; 
        if (sort && sort.toLowerCase() === 'gdp_desc') {
            orderBy = "estimated_gdp DESC";
        } else if (sort && sort.toLowerCase() === 'gdp_asc') {
            orderBy = "estimated_gdp ASC";
        }
        sql += ` ORDER BY ${orderBy}`;

        const countries = await query(sql, queryParams);
        
        res.json(countries.map(formatCountryResponse));
    } catch (error) {
        next(error);
    }
};

// GET /countries/:name (FIXES TEST 3)
exports.getCountryByName = async (req, res, next) => {
    try {
        const countryName = req.params.name;
        // Uses case-insensitive matching in MySQL
        const sql = "SELECT * FROM countries WHERE name = ? LIMIT 1"; 
        const [country] = await query(sql, [countryName]);

        if (!country) {
            return notFoundError(res); // 404 JSON response
        }
        
        res.json(formatCountryResponse(country));
    } catch (error) {
        next(error);
    }
};

// DELETE /countries/:name (FIXES TEST 4)
exports.deleteCountryByName = async (req, res, next) => {
    try {
        const countryName = req.params.name;
        const sql = "DELETE FROM countries WHERE name = ?";
        const result = await query(sql, [countryName]);

        if (result.affectedRows === 0) {
            return notFoundError(res); // 404 JSON response
        }

        res.status(204).send(); // Standard for successful DELETE with no body
    } catch (error) {
        next(error);
    }
};

// GET /countries/image (FIXES TEST 6)
exports.serveSummaryImage = imageGenerator.serveSummaryImage;