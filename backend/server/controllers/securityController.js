const securityService = require('../services/securityService');

function verifyLocalStorage(req, res) {
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ success: false, message: 'filePath is required' });
        }
        
        const verification = securityService.verifyLocalStorage(filePath);
        res.json({ success: true, ...verification });
    } catch (error) {
        console.error('Error verifying local storage:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getRequiredPermissions(req, res) {
    try {
        const permissions = securityService.getRequiredPermissions();
        res.json({ success: true, permissions });
    } catch (error) {
        console.error('Error getting permissions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getMinimalPermissions(req, res) {
    try {
        const permissions = securityService.getMinimalPermissions();
        res.json({ success: true, permissions });
    } catch (error) {
        console.error('Error getting minimal permissions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getDataHandlingPolicies(req, res) {
    try {
        const policies = securityService.getDataHandlingPolicies();
        res.json({ success: true, policies });
    } catch (error) {
        console.error('Error getting data handling policies:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getComplianceInfo(req, res) {
    try {
        const info = securityService.getComplianceInfo();
        res.json({ success: true, ...info });
    } catch (error) {
        console.error('Error getting compliance info:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getSecurityAuditLog(req, res) {
    try {
        const { limit = 100 } = req.query;
        const auditLog = securityService.getSecurityAuditLog(parseInt(limit));
        res.json({ success: true, auditLog });
    } catch (error) {
        console.error('Error getting security audit log:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function clearSecurityAuditLog(req, res) {
    try {
        securityService.clearSecurityAuditLog();
        res.json({ success: true, message: 'Security audit log cleared' });
    } catch (error) {
        console.error('Error clearing security audit log:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function cleanupOldData(req, res) {
    try {
        const result = securityService.cleanupOldData();
        res.json(result);
    } catch (error) {
        console.error('Error cleaning up old data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getSecurityConfig(req, res) {
    try {
        const config = securityService.getSecurityConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error getting security config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function setSecurityConfig(req, res) {
    try {
        const newConfig = req.body;
        const result = securityService.setSecurityConfig(newConfig);
        res.json(result);
    } catch (error) {
        console.error('Error setting security config:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function verifyDataPrivacy(req, res) {
    try {
        const verification = securityService.verifyDataPrivacy();
        res.json({ success: true, ...verification });
    } catch (error) {
        console.error('Error verifying data privacy:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    verifyLocalStorage,
    getRequiredPermissions,
    getMinimalPermissions,
    getDataHandlingPolicies,
    getComplianceInfo,
    getSecurityAuditLog,
    clearSecurityAuditLog,
    cleanupOldData,
    getSecurityConfig,
    setSecurityConfig,
    verifyDataPrivacy
};
