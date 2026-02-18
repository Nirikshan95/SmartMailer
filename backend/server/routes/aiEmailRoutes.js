const express = require('express');
const router = express.Router();
const aiEmailController = require('../controllers/aiEmailController');

// Get available email templates
router.get('/ai-email/templates', aiEmailController.getTemplates);

// Get available tone styles
router.get('/ai-email/tones', aiEmailController.getTones);

// Generate email from template
router.post('/ai-email/generate', aiEmailController.generateEmail);

// Generate email from prompt
router.post('/ai-email/generate-from-prompt', aiEmailController.generateFromPrompt);

// Get AI writing configuration
router.get('/ai-email/config', aiEmailController.getAiConfig);

// Set AI writing configuration
router.post('/ai-email/config', aiEmailController.setAiConfig);

module.exports = router;
