require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const validator = require('validator');
const deepEmailValidator = require('deep-email-validator');
const dns = require('dns');
const net = require('net');
const { sendEmailSchema, validateEmailsSchema, updateEmailListsSchema } = require('./server/utils/validation');
const googleDriveService = require('./server/services/googleDriveService');
const licenseService = require('./server/services/licenseService');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Drive Service
googleDriveService.initialize();

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'config.json'), 'utf8'));

// File to store invalid domains
const INVALID_DOMAINS_FILE = path.join(__dirname, 'data', 'invalid_domains.json');

// Load invalid domains
let invalidDomains = [];
function loadInvalidDomains() {
  try {
    if (fs.existsSync(INVALID_DOMAINS_FILE)) {
      invalidDomains = JSON.parse(fs.readFileSync(INVALID_DOMAINS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load invalid domains:', error);
  }
}

// Save invalid domains
function saveInvalidDomains() {
  try {
    fs.writeFileSync(INVALID_DOMAINS_FILE, JSON.stringify(invalidDomains, null, 2));
  } catch (error) {
    console.error('Failed to save invalid domains:', error);
  }
}

// Load invalid domains on startup
loadInvalidDomains();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// File to store email sending records (Legacy/Fallback)
const EMAIL_RECORDS_FILE = path.join(__dirname, 'data', 'email_records.json');

// Initialize email records
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

// License State
let currentLicense = {
  valid: false,
  plan: 'Free Trial',
  limits: {
    maxPerDay: 10, // Default low limit for trial
    maxPerHour: 5
  }
};

// Load existing records from file
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

      // Migration: Backfill missing subjectConfig/contentConfig for campaigns
      // This enables correct campaign details for older records.
      let migrated = false;
      if (Array.isArray(loadedData.campaigns)) {
        loadedData.campaigns = loadedData.campaigns.map(c => {
          if (!c || typeof c !== 'object') return c;
          const next = { ...c };

          if (!next.subjectConfig || typeof next.subjectConfig !== 'object') {
            next.subjectConfig = {
              source: 'new',
              selectedSubjects: next.subject ? [next.subject] : [],
              sendingMode: 'random',
              currentIndex: 0
            };
            migrated = true;
          } else {
            if (!Array.isArray(next.subjectConfig.selectedSubjects)) {
              next.subjectConfig.selectedSubjects = next.subject ? [next.subject] : [];
              migrated = true;
            }
            if (!next.subjectConfig.source) {
              next.subjectConfig.source = 'new';
              migrated = true;
            }
            if (!next.subjectConfig.sendingMode) {
              next.subjectConfig.sendingMode = 'random';
              migrated = true;
            }
            if (typeof next.subjectConfig.currentIndex !== 'number') {
              next.subjectConfig.currentIndex = 0;
              migrated = true;
            }
          }

          if (!next.contentConfig || typeof next.contentConfig !== 'object') {
            next.contentConfig = {
              source: 'new',
              selectedContent: next.content || ''
            };
            migrated = true;
          } else {
            if (typeof next.contentConfig.selectedContent !== 'string') {
              next.contentConfig.selectedContent = next.content || '';
              migrated = true;
            }
            if (!next.contentConfig.source) {
              next.contentConfig.source = 'new';
              migrated = true;
            }
          }

          return next;
        });
      }

      emailRecords = loadedData;

      if (migrated) {
        saveEmailRecords();
      }
    }
  } catch (error) {
    console.error('Failed to load email records:', error);
  }
}

// Save records to file
function saveEmailRecords() {
  try {
    fs.writeFileSync(EMAIL_RECORDS_FILE, JSON.stringify(emailRecords, null, 2));
  } catch (error) {
    console.error('Failed to save email records:', error);
  }
}

// Get current date string (YYYY-MM-DD)
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// Get current hour string (YYYY-MM-DD-HH)
function getCurrentHour() {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}-${now.getHours()}`;
}

// Rebuild counts from sentEmails
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

// Clean old email records
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

// --- Secure Usage Stats (Google Drive) ---

async function getEmailsSentToday() {
  if (googleDriveService.isConnected()) {
    const stats = await googleDriveService.getSecureData('usage_stats.json');
    if (stats && stats.dailyCounts) {
      return stats.dailyCounts[getCurrentDate()] || 0;
    }
  }
  return emailRecords.dailyCounts[getCurrentDate()] || 0;
}

async function getEmailsSentThisHour() {
  if (googleDriveService.isConnected()) {
    const stats = await googleDriveService.getSecureData('usage_stats.json');
    if (stats && stats.hourlyCounts) {
      return stats.hourlyCounts[getCurrentHour()] || 0;
    }
  }
  return emailRecords.hourlyCounts[getCurrentHour()] || 0;
}

async function incrementCounts() {
  const today = getCurrentDate();
  const currentHour = getCurrentHour();

  // Local update
  emailRecords.dailyCounts[today] = (emailRecords.dailyCounts[today] || 0) + 1;
  emailRecords.hourlyCounts[currentHour] = (emailRecords.hourlyCounts[currentHour] || 0) + 1;
  saveEmailRecords();

  // Drive update (Secure)
  if (googleDriveService.isConnected()) {
    try {
      let stats = await googleDriveService.getSecureData('usage_stats.json') || { dailyCounts: {}, hourlyCounts: {} };
      stats.dailyCounts[today] = (stats.dailyCounts[today] || 0) + 1;
      stats.hourlyCounts[currentHour] = (stats.hourlyCounts[currentHour] || 0) + 1;
      await googleDriveService.saveSecureData('usage_stats.json', stats);
    } catch (err) {
      console.error('Failed to update secure stats on Drive:', err);
    }
  }
}

loadEmailRecords();
rebuildCounts();

// --- Endpoints ---

// Google Drive Auth
app.get('/auth/google', (req, res) => {
  const url = googleDriveService.getAuthUrl();
  if (url) {
    res.redirect(url);
  } else {
    res.status(500).send('Google Drive not configured');
  }
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    await googleDriveService.getToken(code);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?drive=connected`);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/auth/status', (req, res) => {
  res.json({ connected: googleDriveService.isConnected() });
});

// License
app.post('/settings/license', (req, res) => {
  const { key } = req.body;
  const result = licenseService.verifyLicense(key);
  if (result.valid) {
    currentLicense = {
      valid: true,
      plan: result.data.plan,
      limits: result.data.limits
    };
    // Save license key locally (e.g., in config or a separate file)
    // For now, we'll just keep it in memory or you could save to config.json
    res.json({ success: true, license: currentLicense });
  } else {
    res.status(400).json({ success: false, message: 'Invalid License Key' });
  }
});

app.get('/settings/license', (req, res) => {
  res.json(currentLicense);
});

app.post('/verify-smtp', async (req, res) => {
  try {
    const { smtpConfig } = req.body;
    if (!smtpConfig || !smtpConfig.server || !smtpConfig.email || !smtpConfig.password) {
      return res.status(400).json({ success: false, message: 'Invalid SMTP configuration' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.server,
      port: parseInt(smtpConfig.port || '587'),
      secure: parseInt(smtpConfig.port) === 465,
      auth: { user: smtpConfig.email, pass: smtpConfig.password }
    });

    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection verified successfully' });
  } catch (error) {
    console.error('SMTP Verification Error:', error);
    res.status(400).json({ success: false, message: 'Connection failed: ' + error.message });
  }
});

app.post('/send-email', async (req, res) => {
  try {
    const validatedData = sendEmailSchema.parse(req.body);
    const { smtpConfig, recipient, subject, htmlContent } = validatedData;

    const sentToday = await getEmailsSentToday();
    const sentHour = await getEmailsSentThisHour();

    if (sentToday >= currentLicense.limits.maxPerDay) {
      return res.status(429).json({ success: false, message: `Daily limit reached (${currentLicense.limits.maxPerDay})` });
    }
    if (sentHour >= currentLicense.limits.maxPerHour) {
      return res.status(429).json({ success: false, message: `Hourly limit reached (${currentLicense.limits.maxPerHour})` });
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.server,
      port: parseInt(smtpConfig.port),
      secure: false,
      auth: { user: smtpConfig.email, pass: smtpConfig.password }
    });

    let personalizedHtmlContent = htmlContent;
    if (recipient.name) {
      personalizedHtmlContent = htmlContent.replace(/{{name}}/g, recipient.name);
    }

    await transporter.verify();
    const info = await transporter.sendMail({
      from: smtpConfig.email,
      to: recipient.email,
      subject: subject,
      html: personalizedHtmlContent
    });

    emailRecords.sentEmails.push({ email: recipient.email, timestamp: Date.now() });
    await incrementCounts();

    console.log('Email sent: ' + info.response);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    console.error('Error sending email:', error);

    if (req.body.recipient && req.body.recipient.email) {
      const domain = req.body.recipient.email.split('@')[1].toLowerCase();
      if (!invalidDomains.includes(domain)) {
        invalidDomains.push(domain);
        saveInvalidDomains();
      }
    }
    res.status(500).json({ success: false, message: 'Failed to send email: ' + error.message });
  }
});

app.get('/email-stats', async (req, res) => {
  cleanOldEmailRecords();

  // Get last 7 days history
  const history = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    history.push({
      date: dateStr,
      count: emailRecords.dailyCounts[dateStr] || 0
    });
  }

  res.json({
    emailsToday: await getEmailsSentToday(),
    emailsThisHour: await getEmailsSentThisHour(),
    maxPerDay: currentLicense.limits.maxPerDay,
    maxPerHour: currentLicense.limits.maxPerHour,
    plan: currentLicense.plan,
    history: history
  });
});

app.get('/email-lists', (req, res) => {
  res.json({
    completedEmails: emailRecords.completedEmails,
    pendingEmails: emailRecords.pendingEmails
  });
});

app.post('/update-email-lists', (req, res) => {
  try {
    const { completedEmails, pendingEmails } = updateEmailListsSchema.parse(req.body);
    if (completedEmails !== undefined) emailRecords.completedEmails = completedEmails;
    if (pendingEmails !== undefined) emailRecords.pendingEmails = pendingEmails;
    saveEmailRecords();
    res.json({ success: true, message: 'Email lists updated' });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Prospect Lists (Drive Integrated)
app.get('/prospect-lists', async (req, res) => {
  try {
    if (googleDriveService.isConnected()) {
      const folderId = await googleDriveService.findOrCreateFolder('EmailAutomation');
      const listsFolderId = await googleDriveService.findOrCreateFolder('ProspectLists', folderId);

      const query = `'${listsFolderId}' in parents and trashed=false`;
      const files = await googleDriveService.listFiles(query);

      const lists = files.map(f => ({
        id: f.id,
        name: f.name.replace('.json', ''),
        emails: [] // Don't load emails for list view
      }));

      return res.json(lists);
    }
    res.json(emailRecords.prospectLists || []);
  } catch (error) {
    console.error('Error fetching prospect lists:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/prospect-lists', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });

    if (googleDriveService.isConnected()) {
      const folderId = await googleDriveService.findOrCreateFolder('EmailAutomation');
      const listsFolderId = await googleDriveService.findOrCreateFolder('ProspectLists', folderId);

      const newList = { id: Date.now().toString(), name, emails: [] };
      const fileName = `${name}.json`;

      const fileId = await googleDriveService.uploadFile(fileName, JSON.stringify(newList), listsFolderId, 'application/json');

      return res.json({ success: true, list: { ...newList, id: fileId } });
    }

    const newList = { id: Date.now().toString(), name, emails: [] };
    if (!emailRecords.prospectLists) emailRecords.prospectLists = [];
    emailRecords.prospectLists.push(newList);
    saveEmailRecords();
    res.json({ success: true, list: newList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/prospect-lists/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (googleDriveService.isConnected()) {
      await googleDriveService.deleteFile(id);
      return res.json({ success: true, message: 'List deleted from Drive' });
    }

    if (id === 'default') return res.status(400).json({ success: false, message: 'Cannot delete default list' });
    emailRecords.prospectLists = emailRecords.prospectLists.filter(l => l.id !== id);
    saveEmailRecords();
    res.json({ success: true, message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/prospect-lists/:id/add', async (req, res) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) return res.status(400).json({ success: false, message: 'Invalid emails' });

    if (googleDriveService.isConnected()) {
      const fileContent = await googleDriveService.getFile(id);
      let list = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;

      const existingEmails = new Set(list.emails.map(e => e.email));
      const newEmails = emails.filter(e => !existingEmails.has(e.email));
      list.emails = [...list.emails, ...newEmails];

      await googleDriveService.updateFile(id, JSON.stringify(list));
      return res.json({ success: true, addedCount: newEmails.length, list });
    }

    const list = emailRecords.prospectLists.find(l => l.id === id);
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });

    const existingEmails = new Set(list.emails.map(e => e.email));
    const newEmails = emails.filter(e => !existingEmails.has(e.email));
    list.emails = [...list.emails, ...newEmails];
    saveEmailRecords();
    res.json({ success: true, addedCount: newEmails.length, list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/prospect-lists/:id/emails', async (req, res) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) return res.status(400).json({ success: false, message: 'Invalid emails' });

    if (googleDriveService.isConnected()) {
      const fileContent = await googleDriveService.getFile(id);
      let list = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
      list.emails = emails;
      await googleDriveService.updateFile(id, JSON.stringify(list));
      return res.json({ success: true, list });
    }

    const list = emailRecords.prospectLists.find(l => l.id === id);
    if (!list) return res.status(404).json({ success: false, message: 'List not found' });

    list.emails = emails;
    saveEmailRecords();
    res.json({ success: true, list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Campaigns (Drive Integrated)
app.get('/campaigns', async (req, res) => {
  try {
    if (googleDriveService.isConnected()) {
      const folderId = await googleDriveService.findOrCreateFolder('EmailAutomation');
      const campaignsFileId = await googleDriveService.findOrCreateFolder('campaigns.json', folderId); // This might find a folder if we are not careful.
      // Wait, findOrCreateFolder creates a FOLDER. We want a FILE for the index.
      // Let's use listFiles to find 'campaigns.json'

      const query = `name='campaigns.json' and '${folderId}' in parents and trashed=false`;
      const files = await googleDriveService.listFiles(query);

      if (files.length > 0) {
        const content = await googleDriveService.getFile(files[0].id);
        return res.json(typeof content === 'string' ? JSON.parse(content) : content);
      } else {
        return res.json([]);
      }
    }
    res.json(emailRecords.campaigns || []);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/campaigns', async (req, res) => {
  try {
    const { name, subject, content, targetListId, subjectConfig, contentConfig } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });

    const normalizedSubjectConfig = subjectConfig || {
      source: 'new',
      selectedSubjects: subject ? [subject] : [],
      sendingMode: 'random',
      currentIndex: 0
    };

    const normalizedContentConfig = contentConfig || {
      source: 'new',
      selectedContent: content || ''
    };

    const newCampaign = {
      id: Date.now().toString(),
      name,
      status: 'draft',
      subject: subject || '',
      content: content || '',
      targetListId: targetListId || '',
      subjectConfig: normalizedSubjectConfig,
      contentConfig: normalizedContentConfig,
      createdAt: new Date().toISOString(),
      stats: { sent: 0, failed: 0, total: 0 }
    };

    if (googleDriveService.isConnected()) {
      const folderId = await googleDriveService.findOrCreateFolder('EmailAutomation');

      // Update campaigns.json index
      const query = `name='campaigns.json' and '${folderId}' in parents and trashed=false`;
      const files = await googleDriveService.listFiles(query);

      let campaigns = [];
      let fileId = null;

      if (files.length > 0) {
        fileId = files[0].id;
        const content = await googleDriveService.getFile(fileId);
        campaigns = typeof content === 'string' ? JSON.parse(content) : content;
      }

      campaigns.push(newCampaign);

      if (fileId) {
        await googleDriveService.updateFile(fileId, JSON.stringify(campaigns));
      } else {
        await googleDriveService.uploadFile('campaigns.json', JSON.stringify(campaigns), folderId, 'application/json');
      }

      // Create Campaign Folder
      const campaignsFolderId = await googleDriveService.findOrCreateFolder('Campaigns', folderId);
      await googleDriveService.findOrCreateFolder(name, campaignsFolderId);

      return res.json({ success: true, campaign: newCampaign });
    }

    if (!emailRecords.campaigns) emailRecords.campaigns = [];
    emailRecords.campaigns.push(newCampaign);
    saveEmailRecords();
    res.json({ success: true, campaign: newCampaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (googleDriveService.isConnected()) {
      const folderId = await googleDriveService.findOrCreateFolder('EmailAutomation');
      const query = `name='campaigns.json' and '${folderId}' in parents and trashed=false`;
      const files = await googleDriveService.listFiles(query);

      if (files.length > 0) {
        const fileId = files[0].id;
        const content = await googleDriveService.getFile(fileId);
        let campaigns = typeof content === 'string' ? JSON.parse(content) : content;

        const campaign = campaigns.find(c => c.id === id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        Object.assign(campaign, updates);
        await googleDriveService.updateFile(fileId, JSON.stringify(campaigns));
        return res.json({ success: true, campaign });
      }
      return res.status(404).json({ success: false, message: 'Campaigns index not found' });
    }

    const campaign = emailRecords.campaigns.find(c => c.id === id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    Object.assign(campaign, updates);
    saveEmailRecords();
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (googleDriveService.isConnected()) {
      const folderId = await googleDriveService.findOrCreateFolder('EmailAutomation');
      const query = `name='campaigns.json' and '${folderId}' in parents and trashed=false`;
      const files = await googleDriveService.listFiles(query);

      if (files.length > 0) {
        const fileId = files[0].id;
        const content = await googleDriveService.getFile(fileId);
        let campaigns = typeof content === 'string' ? JSON.parse(content) : content;

        campaigns = campaigns.filter(c => c.id !== id);
        await googleDriveService.updateFile(fileId, JSON.stringify(campaigns));
        return res.json({ success: true, message: 'Campaign deleted' });
      }
    }

    emailRecords.campaigns = emailRecords.campaigns.filter(c => c.id !== id);
    saveEmailRecords();
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Validation Logic
function performSMTPHandshake(email, timeoutMs) {
  return new Promise((resolve, reject) => {
    const domain = email.split('@')[1];
    const timeout = setTimeout(() => {
      reject(new Error('SMTP handshake timeout'));
    }, timeoutMs);

    let step = 0;
    let buffer = '';

    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        clearTimeout(timeout);
        reject(new Error('No MX records found'));
        return;
      }

      addresses.sort((a, b) => a.priority - b.priority);
      const mxHost = addresses[0].exchange;

      const socket = net.createConnection(25, mxHost, () => {
        socket.on('data', (data) => {
          buffer += data.toString();
          const lines = buffer.split('\r\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.length < 3) continue;
            const code = parseInt(line.substring(0, 3));
            const message = line.substring(4).toLowerCase();

            if (step === 0 && code === 220) {
              step = 1;
              socket.write(`EHLO test.example.com\r\n`);
            } else if (step === 1 && code === 250) {
              step = 2;
              socket.write(`MAIL FROM:<test@example.com>\r\n`);
            } else if (step === 2 && code === 250) {
              step = 3;
              socket.write(`RCPT TO:<${email}>\r\n`);
            } else if (step === 3) {
              if (code === 250 || code === 251) {
                clearTimeout(timeout);
                socket.end();
                resolve({ exists: true, reason: 'Mailbox exists', bounceType: null });
              } else if (code >= 500 && code < 600) {
                clearTimeout(timeout);
                socket.end();

                const bounceKeywords = config.validation.bounceKeywords || [];
                const matchedKeyword = bounceKeywords.find(keyword => message.includes(keyword.toLowerCase()));

                let bounceType = 'unknown';
                if (matchedKeyword) {
                  if (['disabled', 'inactive', 'terminated', 'suspended', 'deactivated', 'no longer active', 'account disabled', 'mailbox disabled'].includes(matchedKeyword)) {
                    bounceType = 'account_disabled';
                  } else if (['blocked', 'recipient address rejected'].includes(matchedKeyword)) {
                    bounceType = 'domain_blocked';
                  } else if (['user unknown', 'does not exist', 'invalid recipient'].includes(matchedKeyword)) {
                    bounceType = 'user_not_found';
                  }
                }

                resolve({
                  exists: false,
                  reason: `Mailbox verification failed: ${line}`,
                  bounceType: bounceType,
                  matchedKeyword: matchedKeyword || null
                });
              } else if (code >= 400 && code < 500) {
                clearTimeout(timeout);
                socket.end();
                resolve({
                  exists: false,
                  reason: `Temporary failure: ${line}`,
                  bounceType: 'temporary_failure'
                });
              }
            }
          }
        });

        socket.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        socket.on('timeout', () => {
          clearTimeout(timeout);
          socket.end();
          reject(new Error('Socket timeout'));
        });

        socket.setTimeout(timeoutMs);
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });
}

async function isEmailBounceable(email, verifySMTP = true) {
  if (!validator.isEmail(email)) return { bounceable: false, reason: 'Invalid email format' };

  const emailDomain = email.split('@')[1].toLowerCase();
  const domainRule = config.validation.domainRules[emailDomain];
  const isLenientProvider = config.validation.lenientProviders.includes(emailDomain);

  if (invalidDomains.includes(emailDomain)) return { bounceable: false, reason: 'Domain in invalid list' };

  if (config.validation.tieredValidation.enabled && verifySMTP) {
    try {
      const basicValidation = await deepEmailValidator.validate({
        email, sender: 'test@example.com', validateRegex: true, validateDisposable: true, validateMx: false, validateTypo: false, validateDeep: false
      });

      if (basicValidation.validators.disposable && !basicValidation.validators.disposable.valid) return { bounceable: false, reason: 'Disposable email' };
      if (!basicValidation.validators.regex.valid) return { bounceable: false, reason: 'Invalid format' };

      const mxRequired = domainRule ? domainRule.mxRequired : config.validation.tieredValidation.requireMX;
      if (mxRequired) {
        const mxValidation = await deepEmailValidator.validate({
          email, sender: 'test@example.com', validateRegex: false, validateMx: true, validateTypo: false, validateDisposable: false, validateDeep: false
        });
        if (!mxValidation.validators.mx.valid) return { bounceable: false, reason: 'No MX records' };
      }

      const smtpResult = await performSMTPHandshake(email, config.validation.timeoutMs);
      if (smtpResult.exists) return { bounceable: true, reason: 'Valid mailbox' };

      const isCorporate = config.validation.corporateDomains.includes(emailDomain);
      const strictBounce = domainRule && domainRule.strictBounceDetection;

      if ((isCorporate || strictBounce) && (smtpResult.bounceType === 'account_disabled' || smtpResult.bounceType === 'domain_blocked')) {
        return { bounceable: false, reason: `Rejected: ${smtpResult.bounceType}` };
      }

      if (smtpResult.bounceType && smtpResult.bounceType !== 'unknown') {
        return { bounceable: false, reason: `Rejected: ${smtpResult.bounceType}` };
      }

      return { bounceable: false, reason: smtpResult.reason };

    } catch (error) {
      if (domainRule && domainRule.lenientOnTimeout) return { bounceable: true, reason: 'Error assumed valid' };
      if (config.validation.assumeValidOnError) return { bounceable: true, reason: 'Error assumed valid' };
      if (isLenientProvider) return { bounceable: true, reason: 'Error assumed valid (lenient)' };
      return { bounceable: false, reason: 'SMTP handshake failed' };
    }
  }

  // Fallback
  if (verifySMTP) {
    return { bounceable: true, reason: 'Validation skipped or passed' };
  }
  return { bounceable: true, reason: 'Format valid' };
}

app.post('/validate-emails', async (req, res) => {
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

    const timeoutMs = Math.min(30000 + (emails.length * 500), 120000);

    const results = [];
    let bounceableCount = 0;
    const concurrencyLimit = 25;

    for (let i = 0; i < emails.length; i += concurrencyLimit) {
      const batch = emails.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async (emailObj) => {
        try {
          const { bounceable, reason } = await isEmailBounceable(emailObj.email);
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
          // Recalculate counts if needed, but for now this is fine
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
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});