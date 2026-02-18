const express = require('express');
const router = express.Router();
const throttlingController = require('../controllers/throttlingController');

// Get throttling configuration
router.get('/throttling/config', throttlingController.getThrottlingConfig);

// Set throttling configuration
router.post('/throttling/config', throttlingController.setThrottlingConfig);

// Get throttling status
router.get('/throttling/status', throttlingController.getThrottlingStatus);

// Check spam score
router.post('/throttling/check-spam', throttlingController.checkSpamScore);

// Reset burst counter
router.post('/throttling/reset-burst', throttlingController.resetBurstCounter);

module.exports = router;
