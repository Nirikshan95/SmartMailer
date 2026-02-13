const nodemailer = require('nodemailer');
const validator = require('validator');
const deepEmailValidator = require('deep-email-validator');
const dns = require('dns');
const net = require('net');
const config = require('../config');
const storageService = require('./storageService');

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

async function sendEmail(smtpConfig, recipient, subject, htmlContent) {
    // Check limits
    if (storageService.getEmailsSentToday() >= config.emailLimits.maxPerDay) {
        throw new Error('Daily limit reached');
    }
    if (storageService.getEmailsSentThisHour() >= config.emailLimits.maxPerHour) {
        throw new Error('Hourly limit reached');
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

    storageService.addSentEmail(recipient.email);
    return info;
}

module.exports = {
    isEmailBounceable,
    sendEmail
};
