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
    campaigns: []
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

function addSentEmail(email) {
    emailRecords.sentEmails.push({ email, timestamp: Date.now() });
    incrementTodayCount();
    incrementHourCount();
    saveEmailRecords();
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
    addSentEmail
};
