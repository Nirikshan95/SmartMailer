const aiEmailService = require('../services/aiEmailService');

function getTemplates(req, res) {
    try {
        const templates = aiEmailService.getAvailableTemplates();
        res.json({ success: true, templates });
    } catch (error) {
        console.error('Error getting templates:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getTones(req, res) {
    try {
        const tones = aiEmailService.getAvailableTones();
        res.json({ success: true, tones });
    } catch (error) {
        console.error('Error getting tones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function generateEmail(req, res) {
    try {
        const { 
            templateName, 
            recipientData, 
            senderData, 
            options 
        } = req.body;
        
        if (!recipientData || !senderData) {
            return res.status(400).json({ 
                success: false, 
                message: 'recipientData and senderData are required' 
            });
        }
        
        const emailContent = aiEmailService.generateEmailContent(
            templateName,
            recipientData,
            senderData,
            options
        );
        
        res.json({ success: true, ...emailContent });
    } catch (error) {
        console.error('Error generating email:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function generateFromPrompt(req, res) {
    try {
        const { prompt, recipientData, senderData } = req.body;
        
        if (!prompt || !recipientData || !senderData) {
            return res.status(400).json({ 
                success: false, 
                message: 'prompt, recipientData, and senderData are required' 
            });
        }
        
        const emailContent = aiEmailService.generateEmailFromPrompt(
            prompt,
            recipientData,
            senderData
        );
        
        res.json({ success: true, ...emailContent });
    } catch (error) {
        console.error('Error generating email from prompt:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getAiConfig(req, res) {
    try {
        const config = aiEmailService.getAiWritingConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error getting AI config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function setAiConfig(req, res) {
    try {
        const newConfig = req.body;
        const config = aiEmailService.setAiWritingConfig(newConfig);
        res.json({ success: true, message: 'AI config updated', config });
    } catch (error) {
        console.error('Error setting AI config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    getTemplates,
    getTones,
    generateEmail,
    generateFromPrompt,
    getAiConfig,
    setAiConfig
};
