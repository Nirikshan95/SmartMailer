const schedulerService = require('../services/schedulerService');
const storageService = require('../services/storageService');

function scheduleEmail(req, res) {
    try {
        const { 
            smtpConfig, 
            recipient, 
            subject, 
            htmlContent, 
            campaignId, 
            scheduledTime, 
            staggerInterval = 0,
            pacingEnabled = true,
            enableTracking = true,
            baseUrl = 'http://localhost:3001'
        } = req.body;

        if (!smtpConfig || !recipient || !subject || !htmlContent || !scheduledTime) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const scheduledDate = new Date(scheduledTime);
        if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid scheduled time' });
        }

        storageService.addScheduledEmail({
            smtpConfig,
            recipient,
            subject,
            htmlContent,
            campaignId,
            scheduledTime: scheduledDate.getTime(),
            staggerInterval,
            pacingEnabled,
            enableTracking,
            baseUrl
        });

        res.json({ success: true, message: 'Email scheduled successfully' });
    } catch (error) {
        console.error('Error scheduling email:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getScheduledEmails(req, res) {
    try {
        const scheduledEmails = storageService.getScheduledEmails();
        res.json({ success: true, scheduledEmails });
    } catch (error) {
        console.error('Error getting scheduled emails:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function deleteScheduledEmail(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Email ID is required' });
        }

        storageService.removeScheduledEmail(id);
        res.json({ success: true, message: 'Scheduled email deleted' });
    } catch (error) {
        console.error('Error deleting scheduled email:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function startScheduler(req, res) {
    try {
        const { intervalMs = 60000 } = req.body;
        const result = schedulerService.startScheduler(intervalMs);
        res.json(result);
    } catch (error) {
        console.error('Error starting scheduler:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function stopScheduler(req, res) {
    try {
        const result = schedulerService.stopScheduler();
        res.json(result);
    } catch (error) {
        console.error('Error stopping scheduler:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function getSchedulerStatus(req, res) {
    try {
        const status = schedulerService.getSchedulerStatus();
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('Error getting scheduler status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function processScheduledEmailsNow(req, res) {
    try {
        schedulerService.processScheduledEmails().then(results => {
            res.json({ success: true, ...results });
        }).catch(error => {
            console.error('Error processing scheduled emails:', error);
            res.status(500).json({ success: false, message: error.message });
        });
    } catch (error) {
        console.error('Error processing scheduled emails:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    scheduleEmail,
    getScheduledEmails,
    deleteScheduledEmail,
    startScheduler,
    stopScheduler,
    getSchedulerStatus,
    processScheduledEmailsNow
};
