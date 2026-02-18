const express = require('express');
const router = express.Router();
const unsubscribeController = require('../controllers/unsubscribeController');

// Generate unsubscribe link
router.post('/unsubscribe/generate-link', unsubscribeController.generateUnsubscribeLink);

// Generate unsubscribe footer
router.post('/unsubscribe/generate-footer', unsubscribeController.generateUnsubscribeFooter);

// Process unsubscribe request
router.post('/unsubscribe/process', unsubscribeController.processUnsubscribe);

// Get unsubscribe statistics
router.get('/unsubscribe/stats', unsubscribeController.getUnsubscribeStats);

// Get suppression list
router.get('/unsubscribe/suppression-list', unsubscribeController.getSuppressionList);

// Remove from suppression list
router.delete('/unsubscribe/suppression-list/:email', unsubscribeController.removeFromSuppressionList);

// Get compliance information
router.get('/unsubscribe/compliance', unsubscribeController.getComplianceInfo);

// Get unsubscribe configuration
router.get('/unsubscribe/config', unsubscribeController.getUnsubscribeConfig);

// Set unsubscribe configuration
router.post('/unsubscribe/config', unsubscribeController.setUnsubscribeConfig);

module.exports = router;
