const storageService = require('./storageService');

// Default throttling configuration
const defaultConfig = {
    // Rate limits
    maxPerDay: 500,
    maxPerHour: 50,
    maxPerMinute: 5,
    maxPerSecond: 1,
    
    // Staggered sending patterns
    staggerInterval: 2000, // 2 seconds between emails
    enableStaggering: true,
    
    // Spam prevention
    enableSpamCheck: true,
    spamScoreThreshold: 5,
    
    // Advanced throttling
    adaptiveThrottling: true,
    burstLimit: 10, // Allow burst of up to 10 emails
    burstWindow: 60000, // 1 minute burst window
    cooldownPeriod: 300000 // 5 minutes cooldown after burst
};

let throttlingConfig = { ...defaultConfig };
let burstCount = 0;
let burstStartTime = null;
let cooldownUntil = null;

function getThrottlingConfig() {
    return { ...throttlingConfig };
}

function setThrottlingConfig(newConfig) {
    throttlingConfig = { ...throttlingConfig, ...newConfig };
    return throttlingConfig;
}

function resetBurstCounter() {
    burstCount = 0;
    burstStartTime = null;
}

function checkCooldown() {
    if (cooldownUntil && Date.now() < cooldownUntil) {
        const remainingTime = Math.ceil((cooldownUntil - Date.now()) / 1000);
        return { 
            allowed: false, 
            reason: 'cooldown',
            remainingTime 
        };
    }
    
    if (cooldownUntil && Date.now() >= cooldownUntil) {
        cooldownUntil = null;
        resetBurstCounter();
    }
    
    return { allowed: true };
}

function checkRateLimits() {
    const cooldownCheck = checkCooldown();
    if (!cooldownCheck.allowed) {
        return cooldownCheck;
    }

    const emailsToday = storageService.getEmailsSentToday();
    const emailsThisHour = storageService.getEmailsSentThisHour();
    
    // Check per-minute limit
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const minuteKey = `${currentMinute}`;
    const emailsThisMinute = storageService.getEmailRecords().minuteCounts?.[minuteKey] || 0;
    
    // Check per-second limit
    const currentSecond = Math.floor(now / 1000);
    const secondKey = `${currentSecond}`;
    const emailsThisSecond = storageService.getEmailRecords().secondCounts?.[secondKey] || 0;

    if (emailsToday >= throttlingConfig.maxPerDay) {
        return { 
            allowed: false, 
            reason: 'daily_limit',
            limit: throttlingConfig.maxPerDay,
            current: emailsToday
        };
    }

    if (emailsThisHour >= throttlingConfig.maxPerHour) {
        return { 
            allowed: false, 
            reason: 'hourly_limit',
            limit: throttlingConfig.maxPerHour,
            current: emailsThisHour
        };
    }

    if (emailsThisMinute >= throttlingConfig.maxPerMinute) {
        return { 
            allowed: false, 
            reason: 'minute_limit',
            limit: throttlingConfig.maxPerMinute,
            current: emailsThisMinute
        };
    }

    if (emailsThisSecond >= throttlingConfig.maxPerSecond) {
        return { 
            allowed: false, 
            reason: 'second_limit',
            limit: throttlingConfig.maxPerSecond,
            current: emailsThisSecond
        };
    }

    return { allowed: true };
}

function checkBurstLimit() {
    if (!throttlingConfig.adaptiveThrottling) {
        return { allowed: true };
    }

    const now = Date.now();
    
    // Reset burst counter if window expired
    if (burstStartTime && (now - burstStartTime) > throttlingConfig.burstWindow) {
        resetBurstCounter();
    }

    // Start burst window if not started
    if (!burstStartTime) {
        burstStartTime = now;
    }

    // Check if burst limit exceeded
    if (burstCount >= throttlingConfig.burstLimit) {
        cooldownUntil = now + throttlingConfig.cooldownPeriod;
        resetBurstCounter();
        
        return { 
            allowed: false, 
            reason: 'burst_limit_exceeded',
            cooldownPeriod: throttlingConfig.cooldownPeriod
        };
    }

    burstCount++;
    return { allowed: true };
}

function calculateStaggerDelay(emailIndex = 0) {
    if (!throttlingConfig.enableStaggering) {
        return 0;
    }

    // Calculate delay based on email index and stagger interval
    // Use exponential backoff for better pacing
    const baseDelay = throttlingConfig.staggerInterval;
    const adaptiveDelay = baseDelay * (1 + Math.min(emailIndex * 0.1, 2)); // Up to 3x base delay
    
    return Math.floor(adaptiveDelay);
}

function checkSpamScore(htmlContent, subject) {
    if (!throttlingConfig.enableSpamCheck) {
        return { allowed: true, score: 0 };
    }

    let score = 0;
    const issues = [];

    // Check for spam trigger words
    const spamWords = ['free', 'money', 'guarantee', 'winner', 'congratulations', 'urgent', 'act now'];
    const content = (htmlContent + ' ' + subject).toLowerCase();
    
    spamWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
            score += matches.length * 2;
            issues.push(`Contains spam word: ${word} (${matches.length} times)`);
        }
    });

    // Check for excessive capitalization
    const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
    if (capsRatio > 0.5) {
        score += 3;
        issues.push('Excessive capitalization in subject');
    }

    // Check for excessive exclamation marks
    if ((subject.match(/!/g) || []).length > 2) {
        score += 2;
        issues.push('Excessive exclamation marks');
    }

    // Check for excessive links
    const linkCount = (htmlContent.match(/<a\s/gi) || []).length;
    if (linkCount > 10) {
        score += 3;
        issues.push('Too many links in email');
    }

    // Check for image-only content
    if (htmlContent.replace(/<[^>]*>/g, '').trim().length < 50 && htmlContent.includes('<img')) {
        score += 2;
        issues.push('Image-heavy content with little text');
    }

    const allowed = score <= throttlingConfig.spamScoreThreshold;
    
    return { 
        allowed, 
        score, 
        threshold: throttlingConfig.spamScoreThreshold,
        issues: allowed ? [] : issues
    };
}

async function applyThrottling(emailIndex = 0) {
    // Check rate limits
    const rateCheck = checkRateLimits();
    if (!rateCheck.allowed) {
        return rateCheck;
    }

    // Check burst limit
    const burstCheck = checkBurstLimit();
    if (!burstCheck.allowed) {
        return burstCheck;
    }

    // Calculate and apply stagger delay
    const delay = calculateStaggerDelay(emailIndex);
    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    return { allowed: true, delay };
}

function getThrottlingStatus() {
    const cooldownCheck = checkCooldown();
    const rateCheck = checkRateLimits();
    
    return {
        config: getThrottlingConfig(),
        cooldown: {
            inCooldown: !cooldownCheck.allowed,
            remainingTime: cooldownCheck.remainingTime || 0
        },
        burst: {
            count: burstCount,
            limit: throttlingConfig.burstLimit,
            window: throttlingConfig.burstWindow
        },
        rateLimits: {
            allowed: rateCheck.allowed,
            reason: rateCheck.reason || null
        }
    };
}

module.exports = {
    getThrottlingConfig,
    setThrottlingConfig,
    checkRateLimits,
    checkBurstLimit,
    calculateStaggerDelay,
    checkSpamScore,
    applyThrottling,
    getThrottlingStatus,
    resetBurstCounter
};
