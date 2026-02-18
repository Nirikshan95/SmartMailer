const express = require('express');
const router = express.Router();
const schedulerController = require('../controllers/schedulerController');

// Schedule a new email
router.post('/schedule', schedulerController.scheduleEmail);

// Get all scheduled emails
router.get('/scheduled-emails', schedulerController.getScheduledEmails);

// Delete a scheduled email
router.delete('/scheduled-emails/:id', schedulerController.deleteScheduledEmail);

// Start the scheduler
router.post('/scheduler/start', schedulerController.startScheduler);

// Stop the scheduler
router.post('/scheduler/stop', schedulerController.stopScheduler);

// Get scheduler status
router.get('/scheduler/status', schedulerController.getSchedulerStatus);

// Process scheduled emails immediately
router.post('/scheduler/process', schedulerController.processScheduledEmailsNow);

module.exports = router;
