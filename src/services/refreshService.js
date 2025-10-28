// src/services/refreshService.js
const axios = require('axios');
const { pool, query } = require('../config/db');
const { serviceUnavailableError } = require('../utils/errorHandler');
const ImageGenerator = require('./imageGenerator'); 

const COUNTRIES_URL = process.env.COUNTRIES_API_URL;
const EXCHANGE_RATE_URL = process.env.EXCHANGE_RATE_API_URL;

const getRandomMultiplier = () => Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;

const processCountry = (country, exchangeRates) => {
    const { name, capital, region, population, flag, currencies } = country;

    let currency_code = null;
    let exchange_rate = null;
    let estimated_gdp = null;

    if (currencies && currencies.length > 0) {
        // Use the first currency code
        currency_code = currencies[0].code;
        
        if (exchangeRates[currency_code]) {
            exchange_rate = exchangeRates[currency_code];
            
            // CRITICAL: New Random Multiplier
            const randomMultiplier = getRandomMultiplier(); 
            estimated_gdp = (population * randomMultiplier) / exchange_rate;
            
        } else {
            // Currency code found, but no rate (set to null)
            exchange_rate = null;
            estimated_gdp = null;
        }
    } else {
        // No currencies array (set rate/code to null, GDP to 0)
        currency_code = null;
        exchange_rate = null;
        estimated_gdp = 0; 
    }

    return {
        name,
        capital: capital || null,
        region: region || null,
        population: population,
        currency_code: currency_code,
        exchange_rate: exchange_rate !== null ? parseFloat(exchange_rate.toFixed(4)) : null,
        estimated_gdp: estimated_gdp !== null ? parseFloat(estimated_gdp.toFixed(2)) : null,
        flag_url: flag || null,
        last_refreshed_at: new Date()
    };
};

exports.refreshData = async (res) => {
    let connection;
    let countriesData = [];
    let ratesData = {};
    
    try {
        // --- 1. Fetch Exchange Rates (503 Service Unavailable fix) ---
        try {
            const ratesResponse = await axios.get(EXCHANGE_RATE_URL, { timeout: 10000 });
            ratesData = ratesResponse.data.rates;
        } catch (error) {
            return serviceUnavailableError(res, 'Open Exchange Rate API');
        }

        // --- 2. Fetch Countries Data (503 Service Unavailable fix) ---
        try {
            const countriesResponse = await axios.get(COUNTRIES_URL, { timeout: 10000 });
            countriesData = countriesResponse.data;
        } catch (error) {
            return serviceUnavailableError(res, 'Rest Countries API');
        }

        // --- 3. Start Transaction (CRITICAL for data integrity) ---
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const processedCountries = countriesData.map(country => processCountry(country, ratesData));

        // --- 4. Update vs. Insert Loop ---
        for (const country of processedCountries) {
            const mysqlTimestamp = country.last_refreshed_at.toISOString().slice(0, 19).replace('T', ' ');

            const updateSql = `INSERT INTO countries (
                name, capital, region, population, currency_code, exchange_rate, 
                estimated_gdp, flag_url, last_refreshed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                capital = VALUES(capital), region = VALUES(region), population = VALUES(population), 
                currency_code = VALUES(currency_code), exchange_rate = VALUES(exchange_rate), 
                estimated_gdp = VALUES(estimated_gdp), flag_url = VALUES(flag_url), last_refreshed_at = VALUES(last_refreshed_at)`;

            await connection.query(updateSql, [
                country.name, country.capital, country.region, country.population, country.currency_code, 
                country.exchange_rate, country.estimated_gdp, country.flag_url, mysqlTimestamp, // Insert values
            ]);
        }
        
        const totalCountries = processedCountries.length;
        const currentTimestamp = new Date();
        const mysqlTimestamp = currentTimestamp.toISOString().slice(0, 19).replace('T', ' ');

        // --- 5. Update Status Table ---
        await connection.query(
            "UPDATE status SET total_countries = ?, last_refreshed_at = ? WHERE id = 1", 
            [totalCountries, mysqlTimestamp]
        );

        // --- 6. Commit Transaction ---
        await connection.commit();
        
        // --- 7. Image Generation ---
        const topCountries = await query("SELECT name, estimated_gdp FROM countries ORDER BY estimated_gdp DESC LIMIT 5");
        await ImageGenerator.generateSummaryImage(totalCountries, topCountries, currentTimestamp);

        res.status(200).json({ message: "Country data refreshed and cached successfully", total_countries: totalCountries });

    } catch (error) {
        // Rollback if transaction started and failed
        if (connection) {
            await connection.rollback();
        }
        // Throw to the global 500 handler in server.js
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};