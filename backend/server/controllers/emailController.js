const { sendEmailSchema, validateEmailsSchema, updateEmailListsSchema } = require('../../src/schemas/validation');
const emailService = require('../services/emailService');
const storageService = require('../services/storageService');
const config = require('../config');

async function sendEmail(req, res) {
    try {
        const validatedData = sendEmailSchema.parse(req.body);
        const { smtpConfig, recipient, subject, htmlContent } = validatedData;

        try {
            const info = await emailService.sendEmail(smtpConfig, recipient, subject, htmlContent);
            console.log('Email sent: ' + info.response);
            res.json({ success: true, message: 'Email sent successfully' });
        } catch (err) {
            if (err.message === 'Daily limit reached' || err.message === 'Hourly limit reached') {
                return res.status(429).json({ success: false, message: err.message });
            }
            throw err;
        }

    } catch (error) {
        if (error.name === 'ZodError') return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
        console.error('Error sending email:', error);

        if (req.body.recipient && req.body.recipient.email) {
            const domain = req.body.recipient.email.split('@')[1].toLowerCase();
            storageService.addInvalidDomain(domain);
        }
        res.status(500).json({ success: false, message: 'Failed to send email: ' + error.message });
    }
}

function getEmailStats(req, res) {
    storageService.cleanOldEmailRecords();
    res.json({
        emailsToday: storageService.getEmailsSentToday(),
        emailsThisHour: storageService.getEmailsSentThisHour(),
        maxPerDay: config.emailLimits.maxPerDay,
        maxPerHour: config.emailLimits.maxPerHour
    });
}

function getEmailLists(req, res) {
    const records = storageService.getEmailRecords();
    res.json({
        completedEmails: records.completedEmails,
        pendingEmails: records.pendingEmails
    });
}

function updateEmailLists(req, res) {
    try {
        const { completedEmails, pendingEmails } = updateEmailListsSchema.parse(req.body);
        const records = storageService.getEmailRecords();

        if (completedEmails !== undefined) records.completedEmails = completedEmails;
        if (pendingEmails !== undefined) records.pendingEmails = pendingEmails;

        storageService.saveEmailRecords();
        res.json({ success: true, message: 'Email lists updated' });
    } catch (error) {
        if (error.name === 'ZodError') return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
        res.status(500).json({ success: false, message: error.message });
    }
}

async function validateEmails(req, res) {
    try {
        const { emails, useSSE } = validateEmailsSchema.parse(req.body);

        if (useSSE) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            res.write(`data: ${JSON.stringify({ type: 'progress', processed: 0, total: emails.length, percentage: 0 })}\n\n`);
        }

        const results = [];
        let bounceableCount = 0;
        const concurrencyLimit = 25;

        for (let i = 0; i < emails.length; i += concurrencyLimit) {
            const batch = emails.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(async (emailObj) => {
                try {
                    const { bounceable, reason } = await emailService.isEmailBounceable(emailObj.email);
                    return { ...emailObj, bounceable, reason };
                } catch (e) {
                    return { ...emailObj, bounceable: true, reason: 'Error assumed valid' };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            batchResults.forEach(r => { if (r.bounceable) bounceableCount++; });

            if (config.validation.strictMode) {
                const failed = batchResults.filter(r => !r.bounceable);
                if (failed.length > 0) {
                    batchResults.forEach(r => { r.bounceable = false; r.reason = 'Batch rejected (strict)'; });
                }
            }

            if (useSSE && !res.destroyed) {
                res.write(`data: ${JSON.stringify({
                    type: 'progress', processed: results.length, total: emails.length, percentage: Math.round((results.length / emails.length) * 100)
                })}\n\n`);
            }
        }

        const finalResult = {
            success: true,
            bounceableCount,
            totalCount: emails.length,
            bounceableEmails: results.filter(e => e.bounceable),
            invalidEmails: results.filter(e => !e.bounceable)
        };

        if (useSSE && !res.destroyed) {
            res.write(`data: ${JSON.stringify({ type: 'complete', ...finalResult })}\n\n`);
            res.end();
        } else if (!useSSE) {
            res.json(finalResult);
        }

    } catch (error) {
        if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
    }
}

async function processQueuedEmails(req, res) {
    try {
        const results = await emailService.processQueuedEmails();
        res.json({ success: true, ...results });
    } catch (error) {
        console.error('Error processing queued emails:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    sendEmail,
    getEmailStats,
    getEmailLists,
    updateEmailLists,
    validateEmails,
    processQueuedEmails
};
