const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Tracking pixel endpoint for email opens
router.get('/track/open/:trackingId', trackingController.trackOpen);

// Click tracking endpoint
router.get('/track/click/:trackingId', trackingController.trackClick);

// Analytics endpoint
router.get('/analytics', trackingController.getAnalytics);

// Bounce recording endpoint
router.post('/bounce', trackingController.recordBounce);

module.exports = router;
