const storageService = require('../services/storageService');

function trackOpen(req, res) {
    try {
        const { trackingId } = req.params;
        
        // Find the email record associated with this tracking ID
        const emailRecords = storageService.getEmailRecords();
        const sentEmail = emailRecords.sentEmails.find(e => e.trackingId === trackingId);
        
        if (!sentEmail) {
            // Return tracking pixel even if not found to avoid errors
            res.setHeader('Content-Type', 'image/gif');
            res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
            return;
        }
        
        // Record the open event
        storageService.recordEmailOpen(sentEmail.email, sentEmail.campaignId, trackingId);
        
        // Return a 1x1 transparent GIF
        res.setHeader('Content-Type', 'image/gif');
        res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    } catch (error) {
        console.error('Error tracking open:', error);
        res.setHeader('Content-Type', 'image/gif');
        res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
}

function trackClick(req, res) {
    try {
        const { trackingId } = req.params;
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).send('Missing URL parameter');
        }
        
        // Find the email record associated with this tracking ID
        const emailRecords = storageService.getEmailRecords();
        const sentEmail = emailRecords.sentEmails.find(e => e.trackingId === trackingId);
        
        if (sentEmail) {
            // Record the click event
            storageService.recordEmailClick(sentEmail.email, sentEmail.campaignId, trackingId, url);
        }
        
        // Redirect to the original URL
        res.redirect(url);
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).send('Tracking error');
    }
}

function getAnalytics(req, res) {
    try {
        const { campaignId } = req.query;
        const analytics = storageService.getEmailAnalytics(campaignId);
        res.json({ success: true, ...analytics });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

function recordBounce(req, res) {
    try {
        const { email, campaignId, bounceType, reason } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        storageService.recordEmailBounce(email, campaignId, bounceType, reason);
        res.json({ success: true, message: 'Bounce recorded' });
    } catch (error) {
        console.error('Error recording bounce:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    trackOpen,
    trackClick,
    getAnalytics,
    recordBounce
};
