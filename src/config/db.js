// src/config/db.js
const mysql = require('mysql2/promise');

// Create the connection pool using .env variables
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

/**
 * Utility function to execute a query.
 * @param {string} sql - SQL query string.
 * @param {Array<any>} params - Parameters for the query.
 * @returns {Promise<Array<any>>} - Query results (rows).
 */
const query = async (sql, params = []) => {
    // pool.query returns [rows, fields]. We only need rows.
    const [rows] = await pool.query(sql, params);
    return rows;
};

module.exports = { pool, query };