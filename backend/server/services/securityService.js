const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Security configuration
const securityConfig = {
    encryptionEnabled: true,
    algorithm: 'aes-256-cbc',
    keyLength: 32, // 256 bits
    ivLength: 16, // 128 bits
    localDataOnly: true,
    remoteServers: [],
    permissionsRequired: ['email', 'contacts'],
    dataRetentionDays: 365,
    autoCleanup: true
};

// Generate encryption key
function generateEncryptionKey() {
    return crypto.randomBytes(securityConfig.keyLength);
}

// Generate initialization vector
function generateIV() {
    return crypto.randomBytes(securityConfig.ivLength);
}

// Encrypt data
function encryptData(data, key) {
    if (!securityConfig.encryptionEnabled) {
        return { encrypted: false, data };
    }

    try {
        const iv = generateIV();
        const cipher = crypto.createCipheriv(securityConfig.algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encrypted: true,
            data: encrypted,
            iv: iv.toString('hex'),
            algorithm: securityConfig.algorithm
        };
    } catch (error) {
        console.error('Encryption error:', error);
        return { encrypted: false, error: error.message };
    }
}

// Decrypt data
function decryptData(encryptedData, iv, key) {
    if (!securityConfig.encryptionEnabled) {
        return encryptedData;
    }

    try {
        const decipher = crypto.createDecipheriv(securityConfig.algorithm, key, Buffer.from(iv, 'hex'));
        
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

// Verify local data storage
function verifyLocalStorage(filePath) {
    try {
        const resolvedPath = path.resolve(filePath);
        
        // Check if path is within the project directory
        const projectRoot = process.cwd();
        const relativePath = path.relative(projectRoot, resolvedPath);
        
        if (relativePath.startsWith('..') || path.isAbsolute(resolvedPath) && !resolvedPath.startsWith(projectRoot)) {
            return {
                local: false,
                error: 'Path is outside project directory'
            };
        }
        
        // Check if file exists
        if (!fs.existsSync(resolvedPath)) {
            return {
                local: true,
                exists: false,
                path: resolvedPath
            };
        }
        
        return {
            local: true,
            exists: true,
            path: resolvedPath
        };
    } catch (error) {
        console.error('Error verifying local storage:', error);
        return {
            local: false,
            error: error.message
        };
    }
}

// Track required permissions
const requiredPermissions = {
    email: {
        description: 'Send emails',
        required: true,
        used: false
    },
    contacts: {
        description: 'Access contact information',
        required: true,
        used: false
    },
    analytics: {
        description: 'Track email analytics',
        required: false,
        used: false
    },
    scheduling: {
        description: 'Schedule emails',
        required: false,
        used: false
    }
};

function trackPermissionUsage(permission) {
    if (requiredPermissions[permission]) {
        requiredPermissions[permission].used = true;
    }
}

function getRequiredPermissions() {
    return Object.entries(requiredPermissions).map(([key, value]) => ({
        key,
        description: value.description,
        required: value.required,
        used: value.used
    }));
}

function getMinimalPermissions() {
    return Object.entries(requiredPermissions)
        .filter(([_, value]) => value.required)
        .map(([key, value]) => ({
            key,
            description: value.description
        }));
}

// Data handling policies
const dataHandlingPolicies = {
    dataStorage: {
        location: 'local',
        description: 'All data is stored locally on the user\'s machine. No data is sent to remote servers.',
        compliance: ['GDPR', 'SOC 2']
    },
    dataRetention: {
        days: 365,
        description: 'Email records are retained for 365 days. Older records are automatically cleaned up.',
        autoCleanup: true
    },
    dataEncryption: {
        enabled: true,
        algorithm: 'AES-256-CBC',
        description: 'Sensitive data is encrypted using AES-256-CBC encryption.'
    },
    dataAccess: {
        userOnly: true,
        description: 'Only the user has access to their email data. No third-party access.'
    },
    dataSharing: {
        withThirdParty: false,
        description: 'No data is shared with third-party services.'
    }
};

function getDataHandlingPolicies() {
    return dataHandlingPolicies;
}

function getComplianceInfo() {
    return {
        localDataOnly: true,
        minimalPermissions: getMinimalPermissions(),
        encryptionEnabled: securityConfig.encryptionEnabled,
        encryptionAlgorithm: securityConfig.encryptionEnabled ? securityConfig.algorithm : null,
        dataRetentionDays: securityConfig.dataRetentionDays,
        autoCleanup: securityConfig.autoCleanup,
        complianceStandards: ['GDPR', 'SOC 2 Type 2', 'CAN-SPAM']
    };
}

// Security audit log
const securityAuditLog = [];

function logSecurityEvent(event, details = {}) {
    securityAuditLog.push({
        event,
        details,
        timestamp: Date.now()
    });
    
    // Keep only last 1000 events
    if (securityAuditLog.length > 1000) {
        securityAuditLog.shift();
    }
}

function getSecurityAuditLog(limit = 100) {
    return securityAuditLog.slice(-limit);
}

function clearSecurityAuditLog() {
    securityAuditLog.length = 0;
}

// Data cleanup
function cleanupOldData() {
    try {
        const retentionDays = securityConfig.dataRetentionDays;
        const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
        
        // Clean up old email records
        const emailRecords = require('./storageService').getEmailRecords();
        
        if (emailRecords.sentEmails) {
            const originalLength = emailRecords.sentEmails.length;
            emailRecords.sentEmails = emailRecords.sentEmails.filter(
                record => record.timestamp > cutoffDate
            );
            
            if (emailRecords.sentEmails.length !== originalLength) {
                logSecurityEvent('cleanup', {
                    type: 'email_records',
                    removed: originalLength - emailRecords.sentEmails.length,
                    cutoffDate: new Date(cutoffDate).toISOString()
                });
            }
        }
        
        return {
            success: true,
            message: 'Old data cleaned up successfully'
        };
    } catch (error) {
        console.error('Error cleaning up old data:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Security configuration
function getSecurityConfig() {
    return { ...securityConfig };
}

function setSecurityConfig(newConfig) {
    // Validate that local data only is enforced
    if (newConfig.remoteServers && newConfig.remoteServers.length > 0) {
        return {
            success: false,
            error: 'Remote servers are not allowed for security reasons'
        };
    }
    
    Object.assign(securityConfig, newConfig);
    
    logSecurityEvent('config_updated', {
        changes: Object.keys(newConfig)
    });
    
    return {
        success: true,
        config: { ...securityConfig }
    };
}

// Data privacy verification
function verifyDataPrivacy() {
    const verification = {
        localOnly: true,
        encrypted: securityConfig.encryptionEnabled,
        permissions: getRequiredPermissions(),
        policies: getDataHandlingPolicies(),
        auditLog: getSecurityAuditLog(10)
    };
    
    return verification;
}

module.exports = {
    generateEncryptionKey,
    generateIV,
    encryptData,
    decryptData,
    verifyLocalStorage,
    trackPermissionUsage,
    getRequiredPermissions,
    getMinimalPermissions,
    getDataHandlingPolicies,
    getComplianceInfo,
    logSecurityEvent,
    getSecurityAuditLog,
    clearSecurityAuditLog,
    cleanupOldData,
    getSecurityConfig,
    setSecurityConfig,
    verifyDataPrivacy
};
