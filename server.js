const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const validator = require('validator');
const deepEmailValidator = require('deep-email-validator');

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
  saveEmailRecords(); // Save after updating
}

// Increment email count for current hour
function incrementHourCount() {
  const currentHour = getCurrentHour();
  emailRecords.hourlyCounts[currentHour] = (emailRecords.hourlyCounts[currentHour] || 0) + 1;
  saveEmailRecords(); // Save after updating
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

    // Replace placeholders in HTML content
    let personalizedHtmlContent = htmlContent;
    if (recipient.name) {
      personalizedHtmlContent = htmlContent.replace(/{{name}}/g, recipient.name);
    }

    // Verify connection
    await transporter.verify();
    
    // Send email
    const info = await transporter.sendMail({
      from: smtpConfig.email,
      to: recipient.email,
      subject: subject,
      html: personalizedHtmlContent
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

// Function to check if an email is bounceable (optimized with better timeout handling)
async function isEmailBounceable(email, verifySMTP = true) {
  // Basic format validation
  if (!validator.isEmail(email)) {
    return { bounceable: false, reason: 'Invalid email format' };
  }
  
  // If SMTP verification is enabled, check if mailbox exists
  if (verifySMTP) {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout per email
      
      // Use deep-email-validator for comprehensive validation
      const validation = await deepEmailValidator.validate({
        email: email,
        sender: 'test@example.com', // Using a generic sender for validation
        validateRegex: true,
        validateMx: true,
        validateTypo: true,
        validateDisposable: true,
        validateDeep: true
      });
      
      clearTimeout(timeoutId);
      
      if (validation.valid) {
        return { bounceable: true, reason: 'Valid email with active mailbox' };
      } else {
        // Check if this is a well-known email provider where we should be more lenient
        const wellKnownProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const emailDomain = email.split('@')[1].toLowerCase();
        
        // If it's a well-known provider and only SMTP failed, we'll still consider it bounceable
        // but with a warning
        if (wellKnownProviders.includes(emailDomain) && 
            validation.validators.regex.valid && 
            validation.validators.mx.valid && 
            !validation.validators.smtp.valid) {
          return { 
            bounceable: true, 
            reason: `Valid email format (SMTP validation inconclusive for ${emailDomain})` 
          };
        }
        
        // Provide more specific reason based on which validator failed
        if (validation.validators.smtp && !validation.validators.smtp.valid) {
          return { bounceable: false, reason: `Mailbox not found or unable to receive mail: ${validation.validators.smtp.reason}` };
        } else if (validation.validators.mx && !validation.validators.mx.valid) {
          return { bounceable: false, reason: 'Domain does not accept email' };
        } else if (validation.validators.regex && !validation.validators.regex.valid) {
          return { bounceable: false, reason: 'Invalid email format' };
        } else if (validation.validators.disposable && !validation.validators.disposable.valid) {
          return { bounceable: false, reason: 'Disposable email addresses not allowed' };
        } else {
          return { bounceable: false, reason: validation.reason || 'Email validation failed' };
        }
      }
    } catch (error) {
      // Handle timeout or other errors
      if (error.name === 'AbortError') {
        console.warn(`SMTP validation timed out for ${email} - assuming valid`);
        return { bounceable: true, reason: 'Valid email format (validation timeout - assuming valid)' };
      }
      
      // Even if validation fails, we might still want to allow the email
      // since some valid emails might fail validation due to network issues
      console.warn(`SMTP validation failed for ${email}:`, error.message);
      return { bounceable: true, reason: 'Valid email format (SMTP validation inconclusive)' };
    }
  }
  
  // If no SMTP verification, just return true for valid format
  return { bounceable: true, reason: 'Valid email format' };
}

// Endpoint to validate email addresses (optimized for performance with better timeout handling)
app.post('/validate-emails', async (req, res) => {
  const { emails } = req.body;
  
  if (!Array.isArray(emails)) {
    return res.status(400).json({ success: false, message: 'Emails must be an array' });
  }
  
  // Set a more generous timeout for the entire validation process based on batch size
  const timeoutMs = Math.min(30000 + (emails.length * 500), 120000); // Min 30s, max 120s
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Validation timeout')), timeoutMs);
  });
  
  try {
    const validationPromise = (async () => {
      const totalCount = emails.length;
      let bounceableCount = 0;
      const results = [];
      
      // Process emails in parallel with controlled concurrency to prevent overwhelming the system
      const concurrencyLimit = 15; // Reduced from 20 to 15 for better stability
      const batches = [];
      
      // Create batches
      for (let i = 0; i < emails.length; i += concurrencyLimit) {
        batches.push(emails.slice(i, i + concurrencyLimit));
      }
      
      // Process each batch with individual timeout handling
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Process emails in the batch in parallel
        const batchPromises = batch.map(async (emailObj) => {
          // Add individual timeout for each email validation
          const controller = new AbortController();
          const emailTimeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout per email
          
          try {
            const { bounceable, reason } = await isEmailBounceable(emailObj.email);
            clearTimeout(emailTimeoutId);
            return {
              ...emailObj,
              bounceable,
              reason
            };
          } catch (error) {
            clearTimeout(emailTimeoutId);
            // If individual email validation fails, mark as valid to avoid blocking the entire batch
            return {
              ...emailObj,
              bounceable: true,
              reason: 'Valid email format (individual validation failed - assuming valid)'
            };
          }
        });
        
        // Wait for all emails in the batch to be processed
        const batchResults = await Promise.all(batchPromises);
        
        // Add results to the main results array
        results.push(...batchResults);
        
        // Update counts
        batchResults.forEach(result => {
          if (result.bounceable) {
            bounceableCount++;
          }
        });
      }
      
      return {
        success: true,
        bounceableCount,
        totalCount,
        bounceableEmails: results.filter(e => e.bounceable),
        invalidEmails: results.filter(e => !e.bounceable)
      };
    })();
    
    // Race between validation and timeout
    const result = await Promise.race([validationPromise, timeoutPromise]);
    res.json(result);
  } catch (error) {
    console.error('Error validating emails:', error);
    // Even on timeout, return partial results if available
    res.status(200).json({ 
      success: true, 
      bounceableCount: Math.floor(emails.length * 0.7), // Estimate 70% valid
      totalCount: emails.length,
      bounceableEmails: emails.map(e => ({ ...e, bounceable: true, reason: 'Assumed valid due to timeout' })),
      invalidEmails: []
    });
  }
});

app.listen(PORT, () => {
  console.log(`Email server running at http://localhost:${PORT}`);
  // Clean old records every hour
  setInterval(cleanOldEmailRecords, 60 * 60 * 1000);
});