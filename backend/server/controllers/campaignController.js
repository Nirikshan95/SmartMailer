const storageService = require('../services/storageService');

function getCampaigns(req, res) {
    const records = storageService.getEmailRecords();
    res.json(records.campaigns || []);
}

function createCampaign(req, res) {
    try {
        const { name, subject, content, targetListId, subjectConfig } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name required' });

        const newCampaign = {
            id: Date.now().toString(),
            name,
            status: 'draft',
            subject: subject || '',
            content: content || '',
            targetListId: targetListId || '',
            subjectConfig: subjectConfig || {
                source: 'new',
                selectedSubjects: [],
                sendingMode: 'random',
                currentIndex: 0
            },
            createdAt: new Date().toISOString(),
            stats: { sent: 0, failed: 0, total: 0 }
        };

        const records = storageService.getEmailRecords();
        if (!records.campaigns) records.campaigns = [];
        records.campaigns.push(newCampaign);
        storageService.saveEmailRecords();

        res.json({ success: true, campaign: newCampaign });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

function updateCampaign(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;
        const records = storageService.getEmailRecords();
        const campaign = records.campaigns.find(c => c.id === id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        Object.assign(campaign, updates);
        storageService.saveEmailRecords();

        res.json({ success: true, campaign });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

function deleteCampaign(req, res) {
    try {
        const { id } = req.params;
        const records = storageService.getEmailRecords();
        records.campaigns = records.campaigns.filter(c => c.id !== id);
        storageService.saveEmailRecords();

        res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    getCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign
};
