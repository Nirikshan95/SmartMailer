const express = require('express');
const router = express.Router();
const personalizationController = require('../controllers/personalizationController');

// Personalize email with all features
router.post('/personalization/personalize', personalizationController.personalizeEmail);

// Evaluate a single condition
router.post('/personalization/evaluate-condition', personalizationController.evaluateCondition);

// Process conditional content
router.post('/personalization/conditional-content', personalizationController.processConditionalContent);

// Insert dynamic images
router.post('/personalization/dynamic-images', personalizationController.insertDynamicImages);

// Merge fields
router.post('/personalization/merge-fields', personalizationController.mergeFields);

// Generate personalized attachments
router.post('/personalization/attachments', personalizationController.generateAttachments);

// Validate personalization config
router.post('/personalization/validate-config', personalizationController.validateConfig);

module.exports = router;
