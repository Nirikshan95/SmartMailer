const nodemailer = require('nodemailer');
const validator = require('validator');
const deepEmailValidator = require('deep-email-validator');
const dns = require('dns');
const net = require('net');
const crypto = require('crypto');
const config = require('../config');
const storageService = require('./storageService');
const throttlingService = require('./throttlingService');
const attachmentService = require('./attachmentService');

// --- Validation Logic ---

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

    if (storageService.getInvalidDomains().includes(emailDomain)) return { bounceable: false, reason: 'Domain in invalid list' };

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

// --- Sending Logic ---

function generateTrackingId() {
    return crypto.randomBytes(16).toString('hex');
}

function injectTrackingPixel(htmlContent, trackingId, baseUrl) {
    const trackingPixelUrl = `${baseUrl}/api/track/open/${trackingId}`;
    const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    
    // Insert tracking pixel before closing body tag or at the end
    if (htmlContent.includes('</body>')) {
        return htmlContent.replace('</body>', `${trackingPixel}</body>`);
    }
    return htmlContent + trackingPixel;
}

function injectClickTracking(htmlContent, trackingId, baseUrl) {
    const linkRegex = /<a\s+([^>]*href=["'])([^"']+)(["'][^>]*)>/gi;
    
    return htmlContent.replace(linkRegex, (match, prefix, url, suffix) => {
        const trackedUrl = `${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
        return `<a ${prefix}${trackedUrl}${suffix}>`;
    });
}

async function sendEmail(smtpConfig, recipient, subject, htmlContent, campaignId = null, enableTracking = true, baseUrl = 'http://localhost:3001', emailIndex = 0, attachments = []) {
    // Check for duplicate emails
    if (storageService.isEmailAlreadySent(recipient.email, campaignId)) {
        return { 
            success: false, 
            message: 'Email already sent to this recipient', 
            duplicate: true 
        };
    }

    // Apply throttling
    const throttling = await throttlingService.applyThrottling(emailIndex);
    if (!throttling.allowed) {
        storageService.addPendingEmail({
            smtpConfig,
            recipient,
            subject,
            htmlContent,
            campaignId,
            queuedAt: Date.now(),
            reason: throttling.reason || 'Throttling applied'
        });
        return { 
            success: false, 
            message: `Email queued (${throttling.reason})`, 
            queued: true,
            throttling
        };
    }

    // Check spam score
    const spamCheck = throttlingService.checkSpamScore(htmlContent, subject);
    if (!spamCheck.allowed) {
        return { 
            success: false, 
            message: 'Email rejected due to spam score', 
            spamRejected: true,
            spamCheck
        };
    }

    // Check limits
    const emailsToday = storageService.getEmailsSentToday();
    const emailsThisHour = storageService.getEmailsSentThisHour();
    const maxPerDay = config.emailLimits.maxPerDay;
    const maxPerHour = config.emailLimits.maxPerHour;

    if (emailsToday >= maxPerDay) {
        // Queue the email instead of throwing error
        storageService.addPendingEmail({
            smtpConfig,
            recipient,
            subject,
            htmlContent,
            campaignId,
            queuedAt: Date.now(),
            reason: 'Daily limit reached'
        });
        return { 
            success: false, 
            message: 'Email queued (daily limit reached)', 
            queued: true,
            emailsToday,
            maxPerDay
        };
    }
    if (emailsThisHour >= maxPerHour) {
        // Queue the email instead of throwing error
        storageService.addPendingEmail({
            smtpConfig,
            recipient,
            subject,
            htmlContent,
            campaignId,
            queuedAt: Date.now(),
            reason: 'Hourly limit reached'
        });
        return { 
            success: false, 
            message: 'Email queued (hourly limit reached)', 
            queued: true,
            emailsThisHour,
            maxPerHour
        };
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

    // Process attachments
    const { regularAttachments, inlineImages } = attachmentService.processAttachments(attachments, recipient);
    
    // Check attachment limits
    if (attachments && attachments.length > 0) {
        const attachmentCheck = attachmentService.checkAttachmentLimits(attachments);
        if (!attachmentCheck.valid) {
            return {
                success: false,
                message: 'Attachment limit exceeded',
                errors: attachmentCheck.errors
            };
        }
    }
    
    // Replace inline image placeholders
    if (inlineImages.length > 0) {
        personalizedHtmlContent = attachmentService.replaceImagePlaceholders(personalizedHtmlContent, inlineImages);
    }

    // Generate tracking ID and inject tracking if enabled
    let trackingId = null;
    if (enableTracking) {
        trackingId = generateTrackingId();
        personalizedHtmlContent = injectTrackingPixel(personalizedHtmlContent, trackingId, baseUrl);
        personalizedHtmlContent = injectClickTracking(personalizedHtmlContent, trackingId, baseUrl);
    }

    try {
        await transporter.verify();
        
        const mailOptions = {
            from: smtpConfig.email,
            to: recipient.email,
            subject: subject,
            html: personalizedHtmlContent
        };
        
        // Add attachments if present
        if (regularAttachments.length > 0) {
            mailOptions.attachments = regularAttachments;
        }
        
        // Add inline images if present
        if (inlineImages.length > 0) {
            mailOptions.inlineImages = inlineImages;
        }
        
        const info = await transporter.sendMail(mailOptions);

        // Store tracking ID with the sent email
        const sentEmails = storageService.getEmailRecords().sentEmails;
        const lastSentEmail = sentEmails[sentEmails.length - 1];
        if (lastSentEmail && lastSentEmail.email === recipient.email) {
            lastSentEmail.trackingId = trackingId;
            storageService.saveEmailRecords();
        }

        return { success: true, info, trackingId };
    } catch (error) {
        // Record bounce if sending fails
        storageService.recordEmailBounce(recipient.email, campaignId, 'send_failed', error.message);
        throw error;
    }
}

async function processQueuedEmails() {
    const pendingEmails = storageService.getPendingEmails();
    if (pendingEmails.length === 0) {
        return { processed: 0, message: 'No queued emails' };
    }

    const results = {
        processed: 0,
        sent: 0,
        queued: 0,
        failed: 0,
        duplicates: 0
    };

    for (const pendingEmail of pendingEmails) {
        try {
            const result = await sendEmail(
                pendingEmail.smtpConfig,
                pendingEmail.recipient,
                pendingEmail.subject,
                pendingEmail.htmlContent,
                pendingEmail.campaignId
            );

            if (result.success) {
                results.sent++;
                storageService.removePendingEmail(pendingEmail.id);
            } else if (result.queued) {
                results.queued++;
            } else if (result.duplicate) {
                results.duplicates++;
                storageService.removePendingEmail(pendingEmail.id);
            } else {
                results.failed++;
            }
            results.processed++;
        } catch (error) {
            console.error('Failed to process queued email:', error);
            results.failed++;
            results.processed++;
        }
    }

    return results;
}

module.exports = {
    isEmailBounceable,
    sendEmail,
    processQueuedEmails,
    generateTrackingId,
    injectTrackingPixel,
    injectClickTracking
};
