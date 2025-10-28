// src/routes/statusRoutes.js
const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

// GET /status (Test 5)
router.get('/status', statusController.getStatus); 

module.exports = router;