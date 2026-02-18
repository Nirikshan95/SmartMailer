const fs = require('fs');
const path = require('path');

// File paths - adjusted for being in server/services/
const INVALID_DOMAINS_FILE = path.join(__dirname, '../../invalid_domains.json');
const EMAIL_RECORDS_FILE = path.join(__dirname, '../../email_records.json');

// State
let invalidDomains = [];
let emailRecords = {
    dailyCounts: {},
    hourlyCounts: {},
    sentEmails: [],
    completedEmails: [],
    pendingEmails: [],
    prospectLists: [
        { id: 'default', name: 'Default List', emails: [] }
    ],
    campaigns: [],
    emailOpens: [],
    emailClicks: [],
    emailBounces: [],
    scheduledEmails: [],
    suppressionList: [],
    unsubscribeRequests: []
};

// --- Invalid Domains ---

function loadInvalidDomains() {
    try {
        if (fs.existsSync(INVALID_DOMAINS_FILE)) {
            invalidDomains = JSON.parse(fs.readFileSync(INVALID_DOMAINS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Failed to load invalid domains:', error);
    }
}

function saveInvalidDomains() {
    try {
        fs.writeFileSync(INVALID_DOMAINS_FILE, JSON.stringify(invalidDomains, null, 2));
    } catch (error) {
        console.error('Failed to save invalid domains:', error);
    }
}

function getInvalidDomains() {
    return invalidDomains;
}

function addInvalidDomain(domain) {
    if (!invalidDomains.includes(domain)) {
        invalidDomains.push(domain);
        saveInvalidDomains();
    }
}

// --- Email Records ---

function loadEmailRecords() {
    try {
        if (fs.existsSync(EMAIL_RECORDS_FILE)) {
            const data = fs.readFileSync(EMAIL_RECORDS_FILE, 'utf8');
            const loadedData = JSON.parse(data);

            // Migration: Ensure prospectLists exists
            if (!loadedData.prospectLists) {
                loadedData.prospectLists = [
                    { id: 'default', name: 'Default List', emails: loadedData.pendingEmails || [] }
                ];
            }

            if (!loadedData.campaigns) {
                loadedData.campaigns = [];
            }

            // Migration: Ensure analytics arrays exist
            if (!loadedData.emailOpens) {
                loadedData.emailOpens = [];
            }
            if (!loadedData.emailClicks) {
                loadedData.emailClicks = [];
            }
            if (!loadedData.emailBounces) {
                loadedData.emailBounces = [];
            }
            if (!loadedData.scheduledEmails) {
                loadedData.scheduledEmails = [];
            }
            if (!loadedData.suppressionList) {
                loadedData.suppressionList = [];
            }
            if (!loadedData.unsubscribeRequests) {
                loadedData.unsubscribeRequests = [];
            }

            emailRecords = loadedData;
        }
    } catch (error) {
        console.error('Failed to load email records:', error);
    }
}

function saveEmailRecords() {
    try {
        fs.writeFileSync(EMAIL_RECORDS_FILE, JSON.stringify(emailRecords, null, 2));
    } catch (error) {
        console.error('Failed to save email records:', error);
    }
}

function getEmailRecords() {
    return emailRecords;
}

// Helpers for counts
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentHour() {
    const now = new Date();
    return `${now.toISOString().split('T')[0]}-${now.getHours()}`;
}

function rebuildCounts() {
    emailRecords.dailyCounts = {};
    emailRecords.hourlyCounts = {};
    for (const record of emailRecords.sentEmails) {
        const date = new Date(record.timestamp).toISOString().split('T')[0];
        const hour = `${date}-${new Date(record.timestamp).getHours()}`;
        emailRecords.dailyCounts[date] = (emailRecords.dailyCounts[date] || 0) + 1;
        emailRecords.hourlyCounts[hour] = (emailRecords.hourlyCounts[hour] || 0) + 1;
    }
    saveEmailRecords();
}

function cleanOldEmailRecords() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    emailRecords.sentEmails = emailRecords.sentEmails.filter(record => record.timestamp > oneDayAgo);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

    for (const date in emailRecords.dailyCounts) {
        if (date < oneWeekAgoStr) delete emailRecords.dailyCounts[date];
    }
    for (const hour in emailRecords.hourlyCounts) {
        if (hour.substring(0, 10) < oneWeekAgoStr) delete emailRecords.hourlyCounts[hour];
    }
    saveEmailRecords();
}

function getEmailsSentToday() {
    return emailRecords.dailyCounts[getCurrentDate()] || 0;
}

function getEmailsSentThisHour() {
    return emailRecords.hourlyCounts[getCurrentHour()] || 0;
}

function incrementTodayCount() {
    const today = getCurrentDate();
    emailRecords.dailyCounts[today] = (emailRecords.dailyCounts[today] || 0) + 1;
    saveEmailRecords();
}

function incrementHourCount() {
    const currentHour = getCurrentHour();
    emailRecords.hourlyCounts[currentHour] = (emailRecords.hourlyCounts[currentHour] || 0) + 1;
    saveEmailRecords();
}

function addSentEmail(email, campaignId = null) {
    emailRecords.sentEmails.push({ email, timestamp: Date.now(), campaignId });
    incrementTodayCount();
    incrementHourCount();
    saveEmailRecords();
}

function isEmailAlreadySent(email, campaignId = null) {
    return emailRecords.sentEmails.some(record => 
        record.email === email && (!campaignId || record.campaignId === campaignId)
    );
}

function getPendingEmails() {
    return emailRecords.pendingEmails || [];
}

function addPendingEmail(emailData) {
    if (!emailRecords.pendingEmails) emailRecords.pendingEmails = [];
    emailRecords.pendingEmails.push({ ...emailData, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) });
    saveEmailRecords();
}

function removePendingEmail(id) {
    emailRecords.pendingEmails = emailRecords.pendingEmails.filter(e => e.id !== id);
    saveEmailRecords();
}

function recordEmailOpen(email, campaignId, trackingId) {
    emailRecords.emailOpens.push({
        email,
        campaignId,
        trackingId,
        openedAt: Date.now(),
        timestamp: Date.now()
    });
    saveEmailRecords();
}

function recordEmailClick(email, campaignId, trackingId, url) {
    emailRecords.emailClicks.push({
        email,
        campaignId,
        trackingId,
        url,
        clickedAt: Date.now(),
        timestamp: Date.now()
    });
    saveEmailRecords();
}

function recordEmailBounce(email, campaignId, bounceType, reason) {
    emailRecords.emailBounces.push({
        email,
        campaignId,
        bounceType,
        reason,
        bouncedAt: Date.now(),
        timestamp: Date.now()
    });
    saveEmailRecords();
}

function getEmailAnalytics(campaignId = null) {
    const opens = campaignId 
        ? emailRecords.emailOpens.filter(o => o.campaignId === campaignId)
        : emailRecords.emailOpens;
    const clicks = campaignId
        ? emailRecords.emailClicks.filter(c => c.campaignId === campaignId)
        : emailRecords.emailClicks;
    const bounces = campaignId
        ? emailRecords.emailBounces.filter(b => b.campaignId === campaignId)
        : emailRecords.emailBounces;
    const sent = campaignId
        ? emailRecords.sentEmails.filter(s => s.campaignId === campaignId)
        : emailRecords.sentEmails;

    return {
        totalSent: sent.length,
        totalOpens: opens.length,
        totalClicks: clicks.length,
        totalBounces: bounces.length,
        openRate: sent.length > 0 ? ((opens.length / sent.length) * 100).toFixed(2) : 0,
        clickRate: sent.length > 0 ? ((clicks.length / sent.length) * 100).toFixed(2) : 0,
        bounceRate: sent.length > 0 ? ((bounces.length / sent.length) * 100).toFixed(2) : 0,
        opens,
        clicks,
        bounces
    };
}

function addScheduledEmail(emailData) {
    if (!emailRecords.scheduledEmails) emailRecords.scheduledEmails = [];
    emailRecords.scheduledEmails.push({
        ...emailData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        createdAt: Date.now()
    });
    saveEmailRecords();
}

function getScheduledEmails() {
    return emailRecords.scheduledEmails || [];
}

function removeScheduledEmail(id) {
    emailRecords.scheduledEmails = emailRecords.scheduledEmails.filter(e => e.id !== id);
    saveEmailRecords();
}

function updateScheduledEmailStatus(id, status) {
    const email = emailRecords.scheduledEmails.find(e => e.id === id);
    if (email) {
        email.status = status;
        email.updatedAt = Date.now();
        saveEmailRecords();
    }
}

// --- Suppression List ---

function addToSuppressionList(email, reason = 'user_unsubscribed') {
    if (!emailRecords.suppressionList) emailRecords.suppressionList = [];
    
    const existing = emailRecords.suppressionList.find(e => e.email === email);
    if (existing) {
        existing.updatedAt = Date.now();
        existing.reason = reason;
    } else {
        emailRecords.suppressionList.push({
            email,
            reason,
            addedAt: Date.now(),
            updatedAt: Date.now()
        });
    }
    saveEmailRecords();
}

function removeFromSuppressionList(email) {
    emailRecords.suppressionList = emailRecords.suppressionList.filter(e => e.email !== email);
    saveEmailRecords();
}

function isEmailSuppressed(email) {
    return emailRecords.suppressionList.some(e => e.email === email);
}

function getSuppressionList() {
    return emailRecords.suppressionList || [];
}

// --- Unsubscribe Requests ---

function recordUnsubscribeRequest(email, campaignId = null) {
    if (!emailRecords.unsubscribeRequests) emailRecords.unsubscribeRequests = [];
    
    emailRecords.unsubscribeRequests.push({
        email,
        campaignId,
        requestedAt: Date.now(),
        timestamp: Date.now()
    });
    
    addToSuppressionList(email, 'user_unsubscribed');
    saveEmailRecords();
}

function getUnsubscribeRequests(campaignId = null) {
    const requests = emailRecords.unsubscribeRequests || [];
    return campaignId 
        ? requests.filter(r => r.campaignId === campaignId)
        : requests;
}

// Initialize
loadInvalidDomains();
loadEmailRecords();
rebuildCounts();

module.exports = {
    getInvalidDomains,
    addInvalidDomain,
    getEmailRecords,
    saveEmailRecords,
    cleanOldEmailRecords,
    getEmailsSentToday,
    getEmailsSentThisHour,
    addSentEmail,
    isEmailAlreadySent,
    getPendingEmails,
    addPendingEmail,
    removePendingEmail,
    recordEmailOpen,
    recordEmailClick,
    recordEmailBounce,
    getEmailAnalytics,
    addScheduledEmail,
    getScheduledEmails,
    removeScheduledEmail,
    updateScheduledEmailStatus,
    addToSuppressionList,
    removeFromSuppressionList,
    isEmailSuppressed,
    getSuppressionList,
    recordUnsubscribeRequest,
    getUnsubscribeRequests
};
