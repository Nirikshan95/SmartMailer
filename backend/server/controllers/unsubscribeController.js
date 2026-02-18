const unsubscribeService = require('../services/unsubscribeService');
const storageService = require('../services/storageService');

function generateUnsubscribeLink(req, res) {
    try {
        const { email, campaignId, baseUrl } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        const link = unsubscribeService.generateUnsubscribeLink(email, campaignId, baseUrl);
        res.json({ success: true, link });
    } catch (error) {
        console.error('Error generating unsubscribe link:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function generateUnsubscribeFooter(req, res) {
    try {
        const { senderInfo, baseUrl } = req.body;
        
        if (!senderInfo || !senderInfo.companyName) {
            return res.status(400).json({ success: false, message: 'senderInfo with companyName is required' });
        }
        
        const footer = unsubscribeService.generateUnsubscribeFooter(senderInfo, baseUrl);
        res.json({ success: true, footer });
    } catch (error) {
        console.error('Error generating unsubscribe footer:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function processUnsubscribe(req, res) {
    try {
        const { token, email, campaignId, reason } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        const result = unsubscribeService.processUnsubscribeRequest(email, campaignId, reason);
        res.json(result);
    } catch (error) {
        console.error('Error processing unsubscribe:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getUnsubscribeStats(req, res) {
    try {
        const { campaignId } = req.query;
        const stats = unsubscribeService.getUnsubscribeStats(campaignId);
        res.json({ success: true, ...stats });
    } catch (error) {
        console.error('Error getting unsubscribe stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getSuppressionList(req, res) {
    try {
        const suppressionList = storageService.getSuppressionList();
        res.json({ success: true, suppressionList });
    } catch (error) {
        console.error('Error getting suppression list:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function removeFromSuppressionList(req, res) {
    try {
        const { email } = req.params;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        storageService.removeFromSuppressionList(email);
        res.json({ success: true, message: 'Email removed from suppression list' });
    } catch (error) {
        console.error('Error removing from suppression list:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getComplianceInfo(req, res) {
    try {
        const info = unsubscribeService.getComplianceInfo();
        res.json({ success: true, ...info });
    } catch (error) {
        console.error('Error getting compliance info:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getUnsubscribeConfig(req, res) {
    try {
        const config = unsubscribeService.getUnsubscribeConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error getting unsubscribe config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function setUnsubscribeConfig(req, res) {
    try {
        const newConfig = req.body;
        const config = unsubscribeService.setUnsubscribeConfig(newConfig);
        res.json({ success: true, message: 'Config updated', config });
    } catch (error) {
        console.error('Error setting unsubscribe config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    generateUnsubscribeLink,
    generateUnsubscribeFooter,
    processUnsubscribe,
    getUnsubscribeStats,
    getSuppressionList,
    removeFromSuppressionList,
    getComplianceInfo,
    getUnsubscribeConfig,
    setUnsubscribeConfig
};
