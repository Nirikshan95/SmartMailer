const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');

// Verify local storage
router.post('/security/verify-local-storage', securityController.verifyLocalStorage);

// Get required permissions
router.get('/security/permissions', securityController.getRequiredPermissions);

// Get minimal permissions
router.get('/security/minimal-permissions', securityController.getMinimalPermissions);

// Get data handling policies
router.get('/security/data-policies', securityController.getDataHandlingPolicies);

// Get compliance information
router.get('/security/compliance', securityController.getComplianceInfo);

// Get security audit log
router.get('/security/audit-log', securityController.getSecurityAuditLog);

// Clear security audit log
router.delete('/security/audit-log', securityController.clearSecurityAuditLog);

// Clean up old data
router.post('/security/cleanup', securityController.cleanupOldData);

// Get security configuration
router.get('/security/config', securityController.getSecurityConfig);

// Set security configuration
router.post('/security/config', securityController.setSecurityConfig);

// Verify data privacy
router.get('/security/verify-privacy', securityController.verifyDataPrivacy);

module.exports = router;
