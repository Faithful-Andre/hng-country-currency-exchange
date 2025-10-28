// src/routes/countryRoutes.js
const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController'); 

// POST /countries/refresh (Test 1)
router.post('/countries/refresh', countryController.refreshData);

// GET /countries (Test 2)
router.get('/countries', countryController.getAllCountries);      

// GET /countries/image (Test 6)
router.get('/countries/image', countryController.serveSummaryImage); 

// GET /countries/:name (Test 3)
router.get('/countries/:name', countryController.getCountryByName);  

// DELETE /countries/:name (Test 4)
router.delete('/countries/:name', countryController.deleteCountryByName); 

module.exports = router;