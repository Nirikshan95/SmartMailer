const emailService = require('./emailService');
const storageService = require('./storageService');

let schedulerInterval = null;
let isRunning = false;

async function processScheduledEmails() {
    const scheduledEmails = storageService.getScheduledEmails();
    const now = Date.now();
    
    // Filter emails that are due and pending
    const dueEmails = scheduledEmails.filter(e => 
        e.status === 'pending' && 
        e.scheduledTime <= now
    );

    if (dueEmails.length === 0) {
        return { processed: 0, message: 'No due emails' };
    }

    const results = {
        processed: 0,
        sent: 0,
        failed: 0,
        queued: 0,
        duplicates: 0
    };

    for (const scheduledEmail of dueEmails) {
        try {
            // Check if pacing is enabled
            const pacingEnabled = scheduledEmail.pacingEnabled !== false;
            const staggerInterval = scheduledEmail.staggerInterval || 0;

            // Apply pacing delay if needed
            if (pacingEnabled && staggerInterval > 0 && results.processed > 0) {
                await new Promise(resolve => setTimeout(resolve, staggerInterval));
            }

            // Send the email
            const result = await emailService.sendEmail(
                scheduledEmail.smtpConfig,
                scheduledEmail.recipient,
                scheduledEmail.subject,
                scheduledEmail.htmlContent,
                scheduledEmail.campaignId,
                scheduledEmail.enableTracking !== false,
                scheduledEmail.baseUrl || 'http://localhost:3001'
            );

            if (result.success) {
                results.sent++;
                storageService.removeScheduledEmail(scheduledEmail.id);
            } else if (result.queued) {
                results.queued++;
                storageService.updateScheduledEmailStatus(scheduledEmail.id, 'queued');
            } else if (result.duplicate) {
                results.duplicates++;
                storageService.removeScheduledEmail(scheduledEmail.id);
            } else {
                results.failed++;
                storageService.updateScheduledEmailStatus(scheduledEmail.id, 'failed');
            }
            results.processed++;
        } catch (error) {
            console.error('Failed to process scheduled email:', error);
            results.failed++;
            storageService.updateScheduledEmailStatus(scheduledEmail.id, 'failed');
            results.processed++;
        }
    }

    return results;
}

function startScheduler(intervalMs = 60000) {
    if (isRunning) {
        return { success: false, message: 'Scheduler already running' };
    }

    isRunning = true;
    schedulerInterval = setInterval(async () => {
        try {
            await processScheduledEmails();
        } catch (error) {
            console.error('Scheduler error:', error);
        }
    }, intervalMs);

    return { success: true, message: 'Scheduler started' };
}

function stopScheduler() {
    if (!isRunning) {
        return { success: false, message: 'Scheduler not running' };
    }

    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
    isRunning = false;

    return { success: true, message: 'Scheduler stopped' };
}

function getSchedulerStatus() {
    return {
        isRunning,
        intervalMs: schedulerInterval ? 60000 : null
    };
}

module.exports = {
    processScheduledEmails,
    startScheduler,
    stopScheduler,
    getSchedulerStatus
};
