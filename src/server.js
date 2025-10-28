// src/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const countryRoutes = require('./routes/countryRoutes'); 
const statusRoutes = require('./routes/statusRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parses incoming JSON requests

// Serve static image files from the cache directory
// This is not the GET /countries/image endpoint, but useful for hosting the file.
// The GET /countries/image logic is handled in the controller (see Step 10).
app.use('/cache', express.static(path.join(__dirname, '..', 'cache')));

// --- API Routes (CRITICAL: Define paths exactly as required) ---
app.use('/', countryRoutes); // Handles /countries/...
app.use('/', statusRoutes);  // Handles /status

// --- Global 404 Handler ---
app.use((req, res, next) => {
    res.status(404).json({
        error: "Resource not found"
    });
});

// --- Global Error Handler (CRITICAL: Fixes generic 500 errors) ---
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack); // Log stack for debugging
    // Return the specified JSON format for 500 errors
    res.status(500).json({ 
        error: "Internal server error"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});