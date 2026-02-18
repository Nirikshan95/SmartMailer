const personalizationService = require('../services/personalizationService');

function personalizeEmail(req, res) {
    try {
        const { htmlContent, recipientData, personalizationConfig } = req.body;
        
        if (!htmlContent || !recipientData) {
            return res.status(400).json({ 
                success: false, 
                message: 'htmlContent and recipientData are required' 
            });
        }
        
        const result = personalizationService.personalizeEmail(htmlContent, recipientData, personalizationConfig);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error personalizing email:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function evaluateCondition(req, res) {
    try {
        const { condition, recipientData } = req.body;
        
        if (!condition || !recipientData) {
            return res.status(400).json({ 
                success: false, 
                message: 'condition and recipientData are required' 
            });
        }
        
        const result = personalizationService.evaluateCondition(condition, recipientData);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error evaluating condition:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function processConditionalContent(req, res) {
    try {
        const { htmlContent, recipientData, conditionalBlocks } = req.body;
        
        if (!htmlContent || !recipientData) {
            return res.status(400).json({ 
                success: false, 
                message: 'htmlContent and recipientData are required' 
            });
        }
        
        const processedContent = personalizationService.processConditionalContent(
            htmlContent, 
            recipientData, 
            conditionalBlocks
        );
        
        res.json({ success: true, htmlContent: processedContent });
    } catch (error) {
        console.error('Error processing conditional content:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function insertDynamicImages(req, res) {
    try {
        const { htmlContent, recipientData, imageRules } = req.body;
        
        if (!htmlContent || !recipientData) {
            return res.status(400).json({ 
                success: false, 
                message: 'htmlContent and recipientData are required' 
            });
        }
        
        const processedContent = personalizationService.insertDynamicImages(
            htmlContent, 
            recipientData, 
            imageRules
        );
        
        res.json({ success: true, htmlContent: processedContent });
    } catch (error) {
        console.error('Error inserting dynamic images:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function mergeFields(req, res) {
    try {
        const { htmlContent, recipientData, customFields } = req.body;
        
        if (!htmlContent || !recipientData) {
            return res.status(400).json({ 
                success: false, 
                message: 'htmlContent and recipientData are required' 
            });
        }
        
        const processedContent = personalizationService.mergeFields(
            htmlContent, 
            recipientData, 
            customFields
        );
        
        res.json({ success: true, htmlContent: processedContent });
    } catch (error) {
        console.error('Error merging fields:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function generateAttachments(req, res) {
    try {
        const { recipientData, attachmentRules } = req.body;
        
        if (!recipientData) {
            return res.status(400).json({ 
                success: false, 
                message: 'recipientData is required' 
            });
        }
        
        const attachments = personalizationService.generateAttachmentMetadata(
            recipientData, 
            attachmentRules
        );
        
        res.json({ success: true, attachments });
    } catch (error) {
        console.error('Error generating attachments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function validateConfig(req, res) {
    try {
        const config = req.body;
        const validation = personalizationService.validatePersonalizationConfig(config);
        
        res.json({ success: true, ...validation });
    } catch (error) {
        console.error('Error validating config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    personalizeEmail,
    evaluateCondition,
    processConditionalContent,
    insertDynamicImages,
    mergeFields,
    generateAttachments,
    validateConfig
};
