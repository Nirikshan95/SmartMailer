const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/send-email', emailController.sendEmail);
router.get('/email-stats', emailController.getEmailStats);
router.get('/email-lists', emailController.getEmailLists);
router.post('/update-email-lists', emailController.updateEmailLists);
router.post('/validate-emails', emailController.validateEmails);
router.post('/process-queued-emails', emailController.processQueuedEmails);

module.exports = router;
