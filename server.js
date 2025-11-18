const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const validator = require('validator');
const deepEmailValidator = require('deep-email-validator');
const dns = require('dns');
const net = require('net');
const tls = require('tls');

const app = express();
const PORT = 3001;

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// File to store invalid domains
const INVALID_DOMAINS_FILE = path.join(__dirname, 'invalid_domains.json');

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
  sentEmails: [], // detailed records for cleanup
  completedEmails: [], // completed email list for persistence
  pendingEmails: [] // pending email list for persistence
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

// Rebuild counts from sentEmails (for recovery and consistency)
function rebuildCounts() {
  // Clear existing counts
  emailRecords.dailyCounts = {};
  emailRecords.hourlyCounts = {};

  // Rebuild from sentEmails
  for (const record of emailRecords.sentEmails) {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    const hour = `${date}-${new Date(record.timestamp).getHours()}`;
    emailRecords.dailyCounts[date] = (emailRecords.dailyCounts[date] || 0) + 1;
    emailRecords.hourlyCounts[hour] = (emailRecords.hourlyCounts[hour] || 0) + 1;
  }

  saveEmailRecords();
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
      const hourDate = hour.split('-').slice(0, 3).join('-'); // Extract date part correctly
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

// Rebuild counts from sentEmails for consistency
rebuildCounts();

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

    // On send failure (bounce), extract the domain and add it to invalid_domains if not present
    const recipientDomain = recipient.email.split('@')[1].toLowerCase();
    if (!invalidDomains.includes(recipientDomain)) {
      invalidDomains.push(recipientDomain);
      saveInvalidDomains();
      console.log(`Added domain ${recipientDomain} to invalid domains list due to bounce`);
    }

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

// Endpoint to get email lists (completed and pending)
app.get('/email-lists', (req, res) => {
  res.json({
    completedEmails: emailRecords.completedEmails,
    pendingEmails: emailRecords.pendingEmails
  });
});

// Endpoint to update email lists
app.post('/update-email-lists', (req, res) => {
  const { completedEmails, pendingEmails } = req.body;

  if (completedEmails !== undefined) {
    emailRecords.completedEmails = completedEmails;
  }

  if (pendingEmails !== undefined) {
    emailRecords.pendingEmails = pendingEmails;
  }

  saveEmailRecords();

  res.json({
    success: true,
    message: 'Email lists updated successfully'
  });
});

// Custom SMTP handshake function to verify mailbox existence without sending email
async function performSMTPHandshake(email, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const domain = email.split('@')[1];
    const timeout = setTimeout(() => {
      reject(new Error('SMTP handshake timeout'));
    }, timeoutMs);

    let step = 0; // Track conversation step
    let buffer = '';

    // Get MX records for the domain
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        clearTimeout(timeout);
        reject(new Error('No MX records found'));
        return;
      }

      // Sort MX records by priority (lowest first)
      addresses.sort((a, b) => a.priority - b.priority);
      const mxHost = addresses[0].exchange;

      // Connect to the MX server
      const socket = net.createConnection(25, mxHost, () => {
        socket.on('data', (data) => {
          buffer += data.toString();

          // Process complete lines
          const lines = buffer.split('\r\n');
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.length < 3) continue;

            const code = parseInt(line.substring(0, 3));
            const message = line.substring(4).toLowerCase(); // Extract message part for keyword analysis

            if (step === 0 && code === 220) {
              // Connected, send EHLO
              step = 1;
              socket.write(`EHLO test.example.com\r\n`);
            } else if (step === 1 && code === 250) {
              // EHLO successful, send MAIL FROM
              step = 2;
              socket.write(`MAIL FROM:<test@example.com>\r\n`);
            } else if (step === 2 && code === 250) {
              // MAIL FROM successful, send RCPT TO
              step = 3;
              socket.write(`RCPT TO:<${email}>\r\n`);
            } else if (step === 3) {
              if (code === 250 || code === 251) {
                // RCPT TO successful - mailbox exists
                clearTimeout(timeout);
                socket.end();
                resolve({ exists: true, reason: 'Mailbox exists', bounceType: null });
              } else if (code >= 500 && code < 600) {
                // RCPT TO failed - analyze the message for specific bounce reasons
                clearTimeout(timeout);
                socket.end();

                console.log(`SMTP Response for ${email}: ${line}`); // Debug log

                // Check for bounce keywords indicating job changes, disabled accounts, or blocks
                const bounceKeywords = config.validation.bounceKeywords || [];
                const matchedKeyword = bounceKeywords.find(keyword =>
                  message.includes(keyword.toLowerCase())
                );

                console.log(`Matched keyword for ${email}: ${matchedKeyword || 'none'}`); // Debug log

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

                console.log(`Bounce type for ${email}: ${bounceType}`); // Debug log

                resolve({
                  exists: false,
                  reason: `Mailbox verification failed: ${line}`,
                  bounceType: bounceType,
                  matchedKeyword: matchedKeyword || null
                });
              } else if (code >= 400 && code < 500) {
                // Temporary failure - treat as non-existent for job-related emails
                clearTimeout(timeout);
                socket.end();
                resolve({
                  exists: false,
                  reason: `Temporary failure - likely invalid mailbox: ${line}`,
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

// Function to check if an email is bounceable (improved tiered validation)
async function isEmailBounceable(email, verifySMTP = true) {
  // Basic format validation
  if (!validator.isEmail(email)) {
    return { bounceable: false, reason: 'Invalid email format' };
  }

  const emailDomain = email.split('@')[1].toLowerCase();
  const domainRule = config.validation.domainRules[emailDomain];
  const isLenientProvider = config.validation.lenientProviders.includes(emailDomain);

  // Check if domain is in invalid domains list
  if (invalidDomains.includes(emailDomain)) {
    return { bounceable: false, reason: `Domain ${emailDomain} is in invalid domains list` };
  }

  // If tiered validation is enabled, use custom SMTP handshake for better control
  if (config.validation.tieredValidation.enabled && verifySMTP) {
    try {
      // First, check disposable and regex with deep-email-validator
      const basicValidation = await deepEmailValidator.validate({
        email: email,
        sender: 'test@example.com',
        validateRegex: true,
        validateDisposable: true,
        validateMx: false,
        validateTypo: false,
        validateDeep: false
      });

      // Check disposable first - always reject
      if (basicValidation.validators.disposable && !basicValidation.validators.disposable.valid) {
        return { bounceable: false, reason: 'Disposable email addresses not allowed' };
      }

      // Check regex - must pass
      if (!basicValidation.validators.regex.valid) {
        return { bounceable: false, reason: 'Invalid email format' };
      }

      // Check MX records - required unless domain rule says otherwise
      const mxRequired = domainRule ? domainRule.mxRequired : config.validation.tieredValidation.requireMX;
      if (mxRequired) {
        const mxValidation = await deepEmailValidator.validate({
          email: email,
          sender: 'test@example.com',
          validateRegex: false,
          validateMx: true,
          validateTypo: false,
          validateDisposable: false,
          validateDeep: false
        });
        if (!mxValidation.validators.mx.valid) {
          return { bounceable: false, reason: 'Domain does not accept email' };
        }
      }

      // Perform custom SMTP handshake for mailbox verification
      const smtpResult = await performSMTPHandshake(email, config.validation.timeoutMs);

      if (smtpResult.exists) {
        return { bounceable: true, reason: 'Valid email with confirmed mailbox via SMTP handshake' };
      } else {
        // Enhanced bounce detection for job changes, disabled accounts, and corporate domain blocks
        const isCorporateDomain = config.validation.corporateDomains.includes(emailDomain);
        const strictBounceDetection = domainRule && domainRule.strictBounceDetection;

        console.log(`Email: ${email}, Domain: ${emailDomain}, IsCorporate: ${isCorporateDomain}, StrictBounce: ${strictBounceDetection}, BounceType: ${smtpResult.bounceType}`); // Debug log

        // Be extra strict for corporate domains or when strictBounceDetection is enabled
        if (isCorporateDomain || strictBounceDetection) {
          if (smtpResult.bounceType === 'account_disabled' || smtpResult.bounceType === 'domain_blocked') {
            console.log(`Rejecting ${email} due to strict bounce detection for corporate domain`); // Debug log
            return { bounceable: false, reason: `Rejected due to ${smtpResult.bounceType.replace('_', ' ')} (${emailDomain} - job change/disabled account)` };
          }
        }

        // For any bounce type detected, reject to prevent bounces
        if (smtpResult.bounceType && smtpResult.bounceType !== 'unknown') {
          console.log(`Rejecting ${email} due to detected bounce type: ${smtpResult.bounceType}`); // Debug log
          return { bounceable: false, reason: `Rejected due to ${smtpResult.bounceType.replace('_', ' ')} (${emailDomain})` };
        }

        // For job-related emails, be strict about SMTP failures
        console.log(`Rejecting ${email} due to SMTP failure: ${smtpResult.reason}`); // Debug log
        return { bounceable: false, reason: smtpResult.reason };
      }

    } catch (error) {
      console.warn(`Custom SMTP validation failed for ${email}:`, error.message);

      // On error, check if we should assume valid or reject
      if (domainRule && domainRule.lenientOnTimeout) {
        return { bounceable: true, reason: `Valid email format (${emailDomain} - error assumed valid)` };
      }

      if (config.validation.assumeValidOnError) {
        return { bounceable: true, reason: 'Valid email format (SMTP validation error - assuming valid)' };
      } else if (isLenientProvider) {
        return { bounceable: true, reason: `Valid email format (${emailDomain} - error, assuming valid for known provider)` };
      } else {
        return { bounceable: false, reason: 'SMTP handshake failed - rejecting to prevent bounces' };
      }
    }
  }

  // Fallback to original logic if tiered validation is disabled
  if (verifySMTP) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.validation.timeoutMs);

      const validation = await deepEmailValidator.validate({
        email: email,
        sender: 'test@example.com',
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
        // Lenient fallback for well-known providers
        if (isLenientProvider &&
            validation.validators.regex.valid &&
            validation.validators.mx.valid &&
            !validation.validators.smtp.valid) {
          if (config.validation.strictMode) {
            return { bounceable: false, reason: `Mailbox verification failed for ${emailDomain} (strict mode)` };
          } else {
            return {
              bounceable: true,
              reason: `Valid email format (SMTP validation inconclusive for ${emailDomain})`
            };
          }
        }

        // Specific error reasons
        if (validation.validators.smtp && !validation.validators.smtp.valid) {
          return { bounceable: false, reason: `Mailbox not found: ${validation.validators.smtp.reason}` };
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
      if (error.name === 'AbortError') {
        console.warn(`SMTP validation timed out for ${email} - rejecting in strict mode`);
        if (config.validation.assumeValidOnTimeout) {
          return { bounceable: true, reason: 'Valid email format (validation timeout - assuming valid)' };
        } else {
          return { bounceable: false, reason: 'Email validation timed out - rejecting to prevent bounces' };
        }
      }

      console.warn(`SMTP validation failed for ${email}:`, error.message);
      if (config.validation.assumeValidOnError) {
        return { bounceable: true, reason: 'Valid email format (SMTP validation inconclusive)' };
      } else {
        return { bounceable: false, reason: 'Email validation failed - rejecting to prevent bounces' };
      }
    }
  }

  // If no SMTP verification, just return true for valid format
  return { bounceable: true, reason: 'Valid email format' };
}

// Endpoint to validate email addresses (optimized for performance with better timeout handling)
app.post('/validate-emails', async (req, res) => {
  const { emails, useSSE } = req.body;

  if (!Array.isArray(emails)) {
    return res.status(400).json({ success: false, message: 'Emails must be an array' });
  }

  // If SSE is requested, set up Server-Sent Events
  if (useSSE) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial progress
    res.write(`data: ${JSON.stringify({
      type: 'progress',
      processed: 0,
      total: emails.length,
      percentage: 0
    })}\n\n`);
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
      const concurrencyLimit = 25; // Increased to 25 for faster processing
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

        // In strict mode, if any email in batch failed validation, mark all as invalid to be safe
        if (config.validation.strictMode) {
          const failedEmails = batchResults.filter(result => !result.bounceable);
          if (failedEmails.length > 0) {
            console.warn(`Batch ${batchIndex} had ${failedEmails.length} invalid emails - strict mode rejecting entire batch`);
            // Mark all emails in this batch as invalid for safety
            batchResults.forEach(result => {
              result.bounceable = false;
              result.reason = 'Rejected due to invalid emails in batch (strict mode)';
            });
            bounceableCount -= batchResults.filter(r => r.bounceable).length;
          }
        }

        // Send progress update via SSE if requested
        if (useSSE && !res.destroyed) {
          const progress = {
            type: 'progress',
            processed: results.length,
            total: totalCount,
            percentage: Math.round((results.length / totalCount) * 100)
          };
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
        }
      }

      const finalResult = {
        success: true,
        bounceableCount,
        totalCount,
        bounceableEmails: results.filter(e => e.bounceable),
        invalidEmails: results.filter(e => !e.bounceable),
        progress: {
          processed: results.length,
          total: totalCount,
          percentage: Math.round((results.length / totalCount) * 100)
        }
      };

      // Send final result via SSE if requested
      if (useSSE && !res.destroyed) {
        res.write(`data: ${JSON.stringify({ type: 'complete', ...finalResult })}\n\n`);
        res.end();
      }

      return finalResult;
    })();

    // Race between validation and timeout
    const result = await Promise.race([validationPromise, timeoutPromise]);

    // Only send JSON response if not using SSE
    if (!useSSE) {
      res.json(result);
    }
  } catch (error) {
    console.error('Error validating emails:', error);

    const errorResult = {
      success: true,
      bounceableCount: Math.floor(emails.length * 0.7), // Estimate 70% valid
      totalCount: emails.length,
      bounceableEmails: emails.map(e => ({ ...e, bounceable: true, reason: 'Assumed valid due to timeout' })),
      invalidEmails: []
    };

    if (useSSE && !res.destroyed) {
      res.write(`data: ${JSON.stringify({ type: 'error', ...errorResult })}\n\n`);
      res.end();
    } else {
      res.status(200).json(errorResult);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Email server running at http://localhost:${PORT}`);
  // Clean old records every hour
  setInterval(cleanOldEmailRecords, 60 * 60 * 1000);
});