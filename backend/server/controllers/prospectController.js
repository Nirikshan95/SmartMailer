const storageService = require('../services/storageService');

function getLists(req, res) {
    const records = storageService.getEmailRecords();
    res.json(records.prospectLists || []);
}

function createList(req, res) {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name required' });

        const records = storageService.getEmailRecords();
        const newList = { id: Date.now().toString(), name, emails: [] };

        if (!records.prospectLists) records.prospectLists = [];
        records.prospectLists.push(newList);
        storageService.saveEmailRecords();

        res.json({ success: true, list: newList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

function deleteList(req, res) {
    try {
        const { id } = req.params;
        if (id === 'default') return res.status(400).json({ success: false, message: 'Cannot delete default list' });

        const records = storageService.getEmailRecords();
        records.prospectLists = records.prospectLists.filter(l => l.id !== id);
        storageService.saveEmailRecords();

        res.json({ success: true, message: 'List deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

function addEmailsToList(req, res) {
    try {
        const { id } = req.params;
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails)) return res.status(400).json({ success: false, message: 'Invalid emails' });

        const records = storageService.getEmailRecords();
        const list = records.prospectLists.find(l => l.id === id);
        if (!list) return res.status(404).json({ success: false, message: 'List not found' });

        const existingEmails = new Set(list.emails.map(e => e.email));
        const newEmails = emails.filter(e => !existingEmails.has(e.email));
        list.emails = [...list.emails, ...newEmails];
        storageService.saveEmailRecords();

        res.json({ success: true, addedCount: newEmails.length, list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

function updateListEmails(req, res) {
    try {
        const { id } = req.params;
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails)) return res.status(400).json({ success: false, message: 'Invalid emails' });

        const records = storageService.getEmailRecords();
        const list = records.prospectLists.find(l => l.id === id);
        if (!list) return res.status(404).json({ success: false, message: 'List not found' });

        list.emails = emails;
        storageService.saveEmailRecords();

        res.json({ success: true, list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    getLists,
    createList,
    deleteList,
    addEmailsToList,
    updateListEmails
};
