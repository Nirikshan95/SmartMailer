const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// File to store email sending records
const EMAIL_RECORDS_FILE = path.join(__dirname, 'email_records.json');

// Initialize email records
let emailRecords = {
  dailyCounts: {}, // key: date (YYYY-MM-DD), value: count
  hourlyCounts: {}, // key: hour (YYYY-MM-DD-HH), value: count
  sentEmails: [] // detailed records for cleanup
};

// Load existing records from file
function loadEmailRecords() {
  try {
    if (fs.existsSync(EMAIL_RECORDS_FILE)) {
      const data = fs.readFileSync(EMAIL_RECORDS_FILE, 'utf8');
      emailRecords = JSON.parse(data);
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

// Clean old email records (older than 24 hours)
function cleanOldEmailRecords() {
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  emailRecords.sentEmails = emailRecords.sentEmails.filter(record => record.timestamp > oneDayAgo);
  
  // Clean up old daily and hourly counts
  const currentDate = getCurrentDate();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
  
  // Check if we have more than 40 days of records
  const dailyDates = Object.keys(emailRecords.dailyCounts);
  if (dailyDates.length > 40) {
    // Sort dates chronologically
    dailyDates.sort();
    
    // Remove the oldest 10 days
    for (let i = 0; i < 10 && i < dailyDates.length; i++) {
      delete emailRecords.dailyCounts[dailyDates[i]];
      
      // Also remove corresponding hourly counts for those days
      for (const hour in emailRecords.hourlyCounts) {
        if (hour.startsWith(dailyDates[i])) {
          delete emailRecords.hourlyCounts[hour];
        }
      }
    }
  } else {
    // Original cleanup: Remove records older than one week
    for (const date in emailRecords.dailyCounts) {
      if (date < oneWeekAgoStr) {
        delete emailRecords.dailyCounts[date];
      }
    }
    
    // Remove old hourly counts
    for (const hour in emailRecords.hourlyCounts) {
      const hourDate = hour.split('-')[0]; // Extract date part
      if (hourDate < oneWeekAgoStr) {
        delete emailRecords.hourlyCounts[hour];
      }
    }
  }
  
  saveEmailRecords();
}

// Get emails sent today (calendar day)
function getEmailsSentToday() {
  const today = getCurrentDate();
  return emailRecords.dailyCounts[today] || 0;
}

// Get emails sent this hour
function getEmailsSentThisHour() {
  const currentHour = getCurrentHour();
  return emailRecords.hourlyCounts[currentHour] || 0;
}

// Increment email count for today
function incrementTodayCount() {
  const today = getCurrentDate();
  emailRecords.dailyCounts[today] = (emailRecords.dailyCounts[today] || 0) + 1;
}

// Increment email count for current hour
function incrementHourCount() {
  const currentHour = getCurrentHour();
  emailRecords.hourlyCounts[currentHour] = (emailRecords.hourlyCounts[currentHour] || 0) + 1;
}

// Load records on startup
loadEmailRecords();

app.post('/send-email', async (req, res) => {
  const { smtpConfig, recipient, subject, htmlContent } = req.body;

  try {
    // Check daily limit (calendar day)
    const emailsToday = getEmailsSentToday();
    if (emailsToday >= config.emailLimits.maxPerDay) {
      return res.status(429).json({ 
        success: false, 
        message: `Daily email limit reached (${config.emailLimits.maxPerDay} emails). Try again tomorrow.` 
      });
    }

    // Check hourly limit
    const emailsThisHour = getEmailsSentThisHour();
    if (emailsThisHour >= config.emailLimits.maxPerHour) {
      return res.status(429).json({ 
        success: false, 
        message: `Hourly email limit reached (${config.emailLimits.maxPerHour} emails). Please wait before sending more.` 
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.server,
      port: parseInt(smtpConfig.port),
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpConfig.email,
        pass: smtpConfig.password
      }
    });

    // Verify connection
    await transporter.verify();
    
    // Send email
    const info = await transporter.sendMail({
      from: smtpConfig.email,
      to: recipient.email,
      subject: subject,
      html: htmlContent
    });

    // Record successful send
    emailRecords.sentEmails.push({
      email: recipient.email,
      timestamp: Date.now()
    });
    
    // Increment counters
    incrementTodayCount();
    incrementHourCount();
    
    // Save records
    saveEmailRecords();

    console.log('Email sent: ' + info.response);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email: ' + error.message });
  }
});

// Endpoint to get current email counts
app.get('/email-stats', (req, res) => {
  cleanOldEmailRecords();
  const emailsToday = getEmailsSentToday();
  const emailsThisHour = getEmailsSentThisHour();
  
  res.json({
    emailsToday,
    emailsThisHour,
    maxPerDay: config.emailLimits.maxPerDay,
    maxPerHour: config.emailLimits.maxPerHour
  });
});

app.listen(PORT, () => {
  console.log(`Email server running at http://localhost:${PORT}`);
  // Clean old records every hour
  setInterval(cleanOldEmailRecords, 60 * 60 * 1000);
});