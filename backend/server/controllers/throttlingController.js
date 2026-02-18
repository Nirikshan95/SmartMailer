const throttlingService = require('../services/throttlingService');

function getThrottlingConfig(req, res) {
    try {
        const config = throttlingService.getThrottlingConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error getting throttling config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function setThrottlingConfig(req, res) {
    try {
        const newConfig = req.body;
        const config = throttlingService.setThrottlingConfig(newConfig);
        res.json({ success: true, message: 'Throttling config updated', config });
    } catch (error) {
        console.error('Error setting throttling config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getThrottlingStatus(req, res) {
    try {
        const status = throttlingService.getThrottlingStatus();
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('Error getting throttling status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function checkSpamScore(req, res) {
    try {
        const { htmlContent, subject } = req.body;
        
        if (!htmlContent || !subject) {
            return res.status(400).json({ success: false, message: 'htmlContent and subject are required' });
        }
        
        const result = throttlingService.checkSpamScore(htmlContent, subject);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error checking spam score:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function resetBurstCounter(req, res) {
    try {
        throttlingService.resetBurstCounter();
        res.json({ success: true, message: 'Burst counter reset' });
    } catch (error) {
        console.error('Error resetting burst counter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    getThrottlingConfig,
    setThrottlingConfig,
    getThrottlingStatus,
    checkSpamScore,
    resetBurstCounter
};
