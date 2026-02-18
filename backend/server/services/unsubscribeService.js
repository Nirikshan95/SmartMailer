const crypto = require('crypto');
const storageService = require('./storageService');

// Unsubscribe configuration
const unsubscribeConfig = {
    baseUrl: 'http://localhost:3001',
    complianceEnabled: true,
    canSpamCompliant: true,
    gdprCompliant: true,
    includePhysicalAddress: true,
    includePrivacyPolicy: true
};

function generateUnsubscribeToken(email, campaignId = null) {
    const data = `${email}:${campaignId || ''}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

function generateUnsubscribeLink(email, campaignId = null, baseUrl = null) {
    const token = generateUnsubscribeToken(email, campaignId);
    const url = baseUrl || unsubscribeConfig.baseUrl;
    return `${url}/api/unsubscribe/${token}`;
}

function generateUnsubscribeFooter(senderInfo, baseUrl = null) {
    const link = generateUnsubscribeLink(null, null, baseUrl);
    
    let footer = `\n\n---\n`;
    footer += `<p style="font-size: 12px; color: #666;">`;
    footer += `You received this email because you're subscribed to ${senderInfo.companyName}. `;
    footer += `<a href="${link}">Unsubscribe</a> from this list.</p>`;
    
    if (unsubscribeConfig.includePhysicalAddress && senderInfo.address) {
        footer += `<p style="font-size: 12px; color: #666;">`;
        footer += `${senderInfo.companyName}<br>`;
        footer += `${senderInfo.address}<br>`;
        footer += `</p>`;
    }
    
    if (unsubscribeConfig.includePrivacyPolicy && senderInfo.privacyPolicyUrl) {
        footer += `<p style="font-size: 12px; color: #666;">`;
        footer += `<a href="${senderInfo.privacyPolicyUrl}">Privacy Policy</a>`;
        footer += `</p>`;
    }
    
    footer += `</p>`;
    
    return footer;
}

function validateUnsubscribeToken(token) {
    // In a real implementation, you would store tokens with their creation time
    // For now, we'll accept any valid-looking token
    return token && token.length === 64 && /^[a-f0-9]{64}$/.test(token);
}

function processUnsubscribeRequest(email, campaignId = null, reason = 'user_unsubscribed') {
    // Check if email is already suppressed
    if (storageService.isEmailSuppressed(email)) {
        return { success: false, message: 'Email already unsubscribed' };
    }
    
    // Record the unsubscribe request
    storageService.recordUnsubscribeRequest(email, campaignId);
    
    return { success: true, message: 'Unsubscribe processed successfully' };
}

function getUnsubscribeStats(campaignId = null) {
    const suppressionList = storageService.getSuppressionList();
    const unsubscribeRequests = storageService.getUnsubscribeRequests(campaignId);
    
    const stats = {
        totalSuppressed: suppressionList.length,
        totalUnsubscribes: unsubscribeRequests.length,
        reasons: {}
    };
    
    // Count by reason
    suppressionList.forEach(item => {
        stats.reasons[item.reason] = (stats.reasons[item.reason] || 0) + 1;
    });
    
    return stats;
}

function getComplianceInfo() {
    return {
        canSpamCompliant: unsubscribeConfig.canSpamCompliant,
        gdprCompliant: unsubscribeConfig.gdprCompliant,
        requirements: {
            canSpam: [
                'Clear and conspicuous unsubscribe mechanism',
                'Unsubscribe link must be functional for at least 30 days',
                'Physical mailing address included',
                'Subject line not misleading',
                'Accurate header information'
            ],
            gdpr: [
                'Clear consent obtained',
                'Right to unsubscribe',
                'Data minimization',
                'Purpose limitation',
                'Data subject rights'
            ]
        }
    };
}

function getUnsubscribeConfig() {
    return { ...unsubscribeConfig };
}

function setUnsubscribeConfig(newConfig) {
    Object.assign(unsubscribeConfig, newConfig);
    return { ...unsubscribeConfig };
}

module.exports = {
    generateUnsubscribeToken,
    generateUnsubscribeLink,
    generateUnsubscribeFooter,
    validateUnsubscribeToken,
    processUnsubscribeRequest,
    getUnsubscribeStats,
    getComplianceInfo,
    getUnsubscribeConfig,
    setUnsubscribeConfig
};
