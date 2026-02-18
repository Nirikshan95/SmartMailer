const attachmentService = require('../services/attachmentService');

function validateFileSize(req, res) {
    try {
        const { fileSize } = req.body;
        
        if (!fileSize) {
            return res.status(400).json({ success: false, message: 'fileSize is required' });
        }
        
        const validation = attachmentService.validateFileSize(fileSize);
        res.json({ success: true, ...validation });
    } catch (error) {
        console.error('Error validating file size:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function validateMimeType(req, res) {
    try {
        const { mimeType } = req.body;
        
        if (!mimeType) {
            return res.status(400).json({ success: false, message: 'mimeType is required' });
        }
        
        const validation = attachmentService.validateMimeType(mimeType);
        res.json({ success: true, ...validation });
    } catch (error) {
        console.error('Error validating MIME type:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function checkAttachmentLimits(req, res) {
    try {
        const { attachments } = req.body;
        
        if (!attachments) {
            return res.status(400).json({ success: false, message: 'attachments array is required' });
        }
        
        const check = attachmentService.checkAttachmentLimits(attachments);
        res.json({ success: true, ...check });
    } catch (error) {
        console.error('Error checking attachment limits:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getAttachmentConfig(req, res) {
    try {
        const config = attachmentService.getAttachmentConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error getting attachment config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function setAttachmentConfig(req, res) {
    try {
        const newConfig = req.body;
        const result = attachmentService.setAttachmentConfig(newConfig);
        res.json(result);
    } catch (error) {
        console.error('Error setting attachment config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function processAttachments(req, res) {
    try {
        const { attachments, recipientData } = req.body;
        
        if (!attachments) {
            return res.status(400).json({ success: false, message: 'attachments array is required' });
        }
        
        const result = attachmentService.processAttachments(attachments, recipientData);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error processing attachments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function replaceImagePlaceholders(req, res) {
    try {
        const { htmlContent, inlineImages } = req.body;
        
        if (!htmlContent || !inlineImages) {
            return res.status(400).json({ success: false, message: 'htmlContent and inlineImages are required' });
        }
        
        const processed = attachmentService.replaceImagePlaceholders(htmlContent, inlineImages);
        res.json({ success: true, htmlContent: processed });
    } catch (error) {
        console.error('Error replacing image placeholders:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    validateFileSize,
    validateMimeType,
    checkAttachmentLimits,
    getAttachmentConfig,
    setAttachmentConfig,
    processAttachments,
    replaceImagePlaceholders
};
