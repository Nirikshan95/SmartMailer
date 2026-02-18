// AI Email Writing Service
// Generates personalized email content using templates and AI patterns

const emailTemplates = {
    // Business Introduction
    business_introduction: {
        subject: 'Introduction from {{company_name}}',
        body: `<p>Hi {{name}},</p>
<p>I hope this email finds you well. My name is {{sender_name}} from {{company_name}}, and I wanted to reach out to you.</p>
<p>{{personalized_message}}</p>
<p>I noticed that {{company_name}} could help {{company}} with {{value_proposition}}. Our solution has helped similar companies achieve {{benefit}}.</p>
<p>Would you be open to a brief call next week to discuss how we might work together?</p>
<p>Best regards,<br>{{sender_name}}<br>{{title}}<br>{{company_name}}</p>`
    },
    
    // Follow-up
    follow_up: {
        subject: 'Following up on our conversation',
        body: `<p>Hi {{name}},</p>
<p>I wanted to follow up on our previous conversation about {{topic}}.</p>
<p>{{personalized_message}}</p>
<p>I've been thinking about how {{company}} could benefit from {{value_proposition}}. Based on our discussion, I believe our solution can help you achieve {{benefit}}.</p>
<p>Are you available for a quick call this week to continue our discussion?</p>
<p>Best regards,<br>{{sender_name}}<br>{{title}}<br>{{company_name}}</p>`
    },
    
    // Sales Pitch
    sales_pitch: {
        subject: '{{offer}} for {{company}}',
        body: `<p>Hi {{name}},</p>
<p>I hope you're having a great week!</p>
<p>{{personalized_message}}</p>
<p>I wanted to share an exciting opportunity with {{company}}. Our {{product}} has helped businesses like yours increase {{metric}} by {{percentage}}%.</p>
<p>{{key_benefits}}</p>
<p>I'd love to show you how this could work for {{company}}. Would you be interested in a 15-minute demo?</p>
<p>Best regards,<br>{{sender_name}}<br>{{title}}<br>{{company_name}}</p>`
    },
    
    // Meeting Request
    meeting_request: {
        subject: 'Meeting Request: {{purpose}}',
        body: `<p>Hi {{name}},</p>
<p>{{personalized_message}}</p>
<p>I'd like to request a meeting with you to discuss {{purpose}}.</p>
<p>I believe this would be valuable for {{company}} as we can explore {{opportunity}} and how it aligns with your goals.</p>
<p>I'm available on the following times:<br>{{available_times}}</p>
<p>Please let me know what works best for you, or suggest an alternative time that suits your schedule.</p>
<p>Best regards,<br>{{sender_name}}<br>{{title}}<br>{{company_name}}</p>`
    },
    
    // Thank You
    thank_you: {
        subject: 'Thank you for {{reason}}',
        body: `<p>Hi {{name}},</p>
<p>Thank you for {{reason}}. I truly appreciate the time and attention you gave us.</p>
<p>{{personalized_message}}</p>
<p>I enjoyed our conversation about {{topic}} and look forward to continuing our collaboration with {{company}}.</p>
<p>Is there anything else I can help you with at this time?</p>
<p>Best regards,<br>{{sender_name}}<br>{{title}}<br>{{company_name}}</p>`
    },
    
    // News/Update
    news_update: {
        subject: 'Update: {{news_title}}',
        body: `<p>Hi {{name}},</p>
<p>I hope you're doing well!</p>
<p>{{personalized_message}}</p>
<p>I wanted to share some exciting news with you: {{news_content}}</p>
<p>This development is particularly relevant for {{company}} as it relates to {{relevance}}.</p>
<p>Would you like to discuss how this might impact your business?</p>
<p>Best regards,<br>{{sender_name}}<br>{{title}}<br>{{company_name}}</p>`
    }
};

const toneStyles = {
    professional: {
        greeting: 'Dear {{name}}',
        closing: 'Best regards',
        language_level: 'formal'
    },
    friendly: {
        greeting: 'Hi {{name}}',
        closing: 'Best',
        language_level: 'casual'
    },
    casual: {
        greeting: 'Hey {{name}}',
        closing: 'Thanks',
        language_level: 'informal'
    }
};

const aiWritingConfig = {
    defaultTemplate: 'business_introduction',
    defaultTone: 'professional',
    maxLength: 500,
    enablePersonalization: true,
    useSmartPhrasing: true
};

function getAvailableTemplates() {
    return Object.keys(emailTemplates);
}

function getAvailableTones() {
    return Object.keys(toneStyles);
}

function getTemplate(templateName) {
    return emailTemplates[templateName] || emailTemplates.business_introduction;
}

function generatePersonalizedMessage(recipientData, context) {
    const { name, company, industry, role, interests } = recipientData;
    const { purpose, relationship } = context;
    
    const messages = {
        introduction: [
            `I've been following ${company}'s work in the ${industry} space and was impressed by your recent achievements.`,
            `I came across ${company} while researching leaders in the ${industry} industry and was drawn to your innovative approach.`,
            `Your work at ${company} has caught my attention, particularly your contributions to ${industry}.`
        ],
        follow_up: [
            `Since our last conversation, I've been thinking about how we could help ${company} achieve its goals.`,
            `I wanted to circle back on our discussion about ${company}'s initiatives and explore potential collaboration.`,
            `Following up on our previous exchange, I believe there's a great opportunity for us to work together.`
        ],
        sales: [
            `I believe ${company} is at an exciting stage, and our solution could accelerate your growth trajectory.`,
            `Given ${company}'s position in the ${industry} market, I think you'd find our offering particularly valuable.`,
            `After researching ${company}'s business model, I'm confident our solution addresses your key challenges.`
        ],
        default: [
            `I hope this message finds you well. I wanted to reach out regarding a potential opportunity.`,
            `I'm writing to you today because I believe ${company} could benefit from what we offer.`,
            `I've been following ${company}'s progress and wanted to connect regarding a mutual interest.`
        ]
    };
    
    const purposeMessages = messages[purpose] || messages.default;
    return purposeMessages[Math.floor(Math.random() * purposeMessages.length)];
}

function generateKeyBenefits(product, benefits) {
    const benefitTemplates = [
        `• ${benefits[0] || 'Increased efficiency'} with our solution`,
        `• ${benefits[1] || 'Cost savings'} of up to 30%`,
        `• ${benefits[2] || 'Improved productivity'} for your team`,
        `• ${benefits[3] || 'Enhanced customer satisfaction'}`
    ];
    
    return benefitTemplates.join('<br>');
}

function generateEmailContent(templateName, recipientData, senderData, options = {}) {
    const template = getTemplate(templateName);
    const tone = options.tone || aiWritingConfig.defaultTone;
    const toneStyle = toneStyles[tone] || toneStyles.professional;
    
    // Generate personalized message
    const personalizedMessage = aiWritingConfig.enablePersonalization
        ? generatePersonalizedMessage(recipientData, options.context || {})
        : '';
    
    // Prepare replacement data
    const replacements = {
        ...recipientData,
        ...senderData,
        personalized_message: personalizedMessage,
        key_benefits: generateKeyBenefits(options.product, options.benefits || []),
        available_times: options.availableTimes || 'Monday-Friday, 9am-5pm'
    };
    
    // Replace placeholders in template
    let body = template.body;
    let subject = template.subject;
    
    Object.keys(replacements).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = replacements[key] || '';
        body = body.replace(new RegExp(placeholder, 'g'), value);
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Apply tone adjustments
    if (toneStyle.greeting) {
        body = body.replace(/Hi {{name}}/g, toneStyle.greeting);
    }
    if (toneStyle.closing) {
        body = body.replace(/Best regards/g, toneStyle.closing);
    }
    
    // Truncate if exceeds max length
    if (body.length > aiWritingConfig.maxLength) {
        body = body.substring(0, aiWritingConfig.maxLength - 50) + '...';
    }
    
    return {
        subject,
        body,
        tone,
        template: templateName,
        wordCount: body.split(/\s+/).length
    };
}

function generateEmailFromPrompt(prompt, recipientData, senderData) {
    // Simple AI-like generation based on prompt keywords
    const promptLower = prompt.toLowerCase();
    
    let templateName = aiWritingConfig.defaultTemplate;
    
    if (promptLower.includes('follow') || promptLower.includes('follow up')) {
        templateName = 'follow_up';
    } else if (promptLower.includes('sales') || promptLower.includes('pitch') || promptLower.includes('offer')) {
        templateName = 'sales_pitch';
    } else if (promptLower.includes('meeting') || promptLower.includes('call') || promptLower.includes('discuss')) {
        templateName = 'meeting_request';
    } else if (promptLower.includes('thank')) {
        templateName = 'thank_you';
    } else if (promptLower.includes('news') || promptLower.includes('update')) {
        templateName = 'news_update';
    }
    
    // Extract context from prompt
    const options = {
        tone: promptLower.includes('casual') ? 'casual' : 
                promptLower.includes('friendly') ? 'friendly' : 'professional',
        context: {
            purpose: promptLower.includes('follow') ? 'follow_up' : 'introduction',
            relationship: promptLower.includes('existing') ? 'existing' : 'new'
        }
    };
    
    return generateEmailContent(templateName, recipientData, senderData, options);
}

function getAiWritingConfig() {
    return { ...aiWritingConfig };
}

function setAiWritingConfig(newConfig) {
    Object.assign(aiWritingConfig, newConfig);
    return { ...aiWritingConfig };
}

module.exports = {
    getAvailableTemplates,
    getAvailableTones,
    generateEmailContent,
    generateEmailFromPrompt,
    getAiWritingConfig,
    setAiWritingConfig
};
