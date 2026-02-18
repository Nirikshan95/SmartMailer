const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');

// Validate file size
router.post('/attachments/validate-size', attachmentController.validateFileSize);

// Validate MIME type
router.post('/attachments/validate-mime', attachmentController.validateMimeType);

// Check attachment limits
router.post('/attachments/check-limits', attachmentController.checkAttachmentLimits);

// Get attachment configuration
router.get('/attachments/config', attachmentController.getAttachmentConfig);

// Set attachment configuration
router.post('/attachments/config', attachmentController.setAttachmentConfig);

// Process attachments
router.post('/attachments/process', attachmentController.processAttachments);

// Replace image placeholders
router.post('/attachments/replace-placeholders', attachmentController.replaceImagePlaceholders);

module.exports = router;
