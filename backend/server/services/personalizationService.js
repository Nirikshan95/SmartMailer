// Advanced Personalization Service
// Handles conditional content, dynamic images, attachments, and multi-field merging

// Conditional content logic
function evaluateCondition(condition, recipientData) {
    const { field, operator, value } = condition;
    const fieldValue = recipientData[field];

    switch (operator) {
        case 'equals':
            return fieldValue === value;
        case 'not_equals':
            return fieldValue !== value;
        case 'contains':
            return typeof fieldValue === 'string' && fieldValue.includes(value);
        case 'not_contains':
            return typeof fieldValue === 'string' && !fieldValue.includes(value);
        case 'greater_than':
            return typeof fieldValue === 'number' && fieldValue > value;
        case 'less_than':
            return typeof fieldValue === 'number' && fieldValue < value;
        case 'in':
            return Array.isArray(value) && value.includes(fieldValue);
        case 'not_in':
            return Array.isArray(value) && !value.includes(fieldValue);
        case 'is_empty':
            return !fieldValue || fieldValue === '';
        case 'is_not_empty':
            return fieldValue && fieldValue !== '';
        default:
            return false;
    }
}

function processConditionalContent(htmlContent, recipientData, conditionalBlocks) {
    if (!conditionalBlocks || conditionalBlocks.length === 0) {
        return htmlContent;
    }

    let processedContent = htmlContent;

    conditionalBlocks.forEach(block => {
        const { id, conditions, content, elseContent } = block;
        const blockRegex = new RegExp(`<!--\\s*conditional:${id}\\s*start\\s*-->([\\s\\S]*?)<!--\\s*conditional:${id}\\s*end\\s*-->`, 'g');

        const shouldShow = conditions.every(condition => evaluateCondition(condition, recipientData));
        const replacement = shouldShow ? content : (elseContent || '');

        processedContent = processedContent.replace(blockRegex, replacement);
    });

    return processedContent;
}

// Dynamic image insertion
function insertDynamicImages(htmlContent, recipientData, imageRules) {
    if (!imageRules || imageRules.length === 0) {
        return htmlContent;
    }

    let processedContent = htmlContent;

    imageRules.forEach(rule => {
        const { placeholder, imageUrl, altText, condition } = rule;
        
        // Check if condition is met
        if (condition && !evaluateCondition(condition, recipientData)) {
            return;
        }

        // Replace placeholder with dynamic image
        const imgTag = `<img src="${imageUrl}" alt="${altText || ''}" style="max-width: 100%; height: auto;" />`;
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), imgTag);
    });

    return processedContent;
}

// Multi-field data merging
function mergeFields(htmlContent, recipientData, customFields = {}) {
    let processedContent = htmlContent;

    // Standard fields
    const standardFields = {
        'name': recipientData.name || '',
        'email': recipientData.email || '',
        'company': recipientData.company || '',
        'title': recipientData.title || '',
        'phone': recipientData.phone || '',
        'industry': recipientData.industry || '',
        'location': recipientData.location || '',
        'website': recipientData.website || '',
        'firstName': recipientData.name ? recipientData.name.split(' ')[0] : '',
        'lastName': recipientData.name ? recipientData.name.split(' ').slice(-1)[0] : ''
    };

    // Merge all fields
    const allFields = { ...standardFields, ...customFields };

    // Replace all placeholders
    Object.keys(allFields).forEach(field => {
        const placeholder = new RegExp(`{{${field}}}`, 'g');
        processedContent = processedContent.replace(placeholder, allFields[field] || '');
    });

    return processedContent;
}

// Personalized attachment support
function generateAttachmentMetadata(recipientData, attachmentRules) {
    if (!attachmentRules || attachmentRules.length === 0) {
        return [];
    }

    const attachments = [];

    attachmentRules.forEach(rule => {
        const { fileName, condition, personalizeFilename } = rule;
        
        // Check if condition is met
        if (condition && !evaluateCondition(condition, recipientData)) {
            return;
        }

        let finalFileName = fileName;
        
        // Personalize filename if enabled
        if (personalizeFilename && recipientData.name) {
            const nameParts = recipientData.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            finalFileName = fileName
                .replace('{{firstName}}', firstName)
                .replace('{{lastName}}', lastName)
                .replace('{{name}}', recipientData.name)
                .replace('{{company}}', recipientData.company || '');
        }

        attachments.push({
            fileName: finalFileName,
            path: rule.filePath || rule.url
        });
    });

    return attachments;
}

// Complete personalization pipeline
function personalizeEmail(htmlContent, recipientData, personalizationConfig = {}) {
    const {
        conditionalBlocks = [],
        imageRules = [],
        attachmentRules = [],
        customFields = {}
    } = personalizationConfig;

    let processedContent = htmlContent;

    // Step 1: Process conditional content
    processedContent = processConditionalContent(processedContent, recipientData, conditionalBlocks);

    // Step 2: Insert dynamic images
    processedContent = insertDynamicImages(processedContent, recipientData, imageRules);

    // Step 3: Merge all fields
    processedContent = mergeFields(processedContent, recipientData, customFields);

    // Step 4: Generate personalized attachments
    const attachments = generateAttachmentMetadata(recipientData, attachmentRules);

    return {
        htmlContent: processedContent,
        attachments
    };
}

// Helper function to create conditional blocks
function createConditionalBlock(id, conditions, content, elseContent = '') {
    return {
        id,
        conditions,
        content,
        elseContent
    };
}

// Helper function to create image rules
function createImageRule(placeholder, imageUrl, altText, condition = null) {
    return {
        placeholder,
        imageUrl,
        altText,
        condition
    };
}

// Helper function to create attachment rules
function createAttachmentRule(fileName, filePath, condition = null, personalizeFilename = false) {
    return {
        fileName,
        filePath,
        condition,
        personalizeFilename
    };
}

// Validate personalization config
function validatePersonalizationConfig(config) {
    const errors = [];

    if (config.conditionalBlocks) {
        config.conditionalBlocks.forEach((block, index) => {
            if (!block.id) errors.push(`Conditional block ${index}: Missing id`);
            if (!block.conditions || !Array.isArray(block.conditions)) {
                errors.push(`Conditional block ${index}: Invalid conditions`);
            }
        });
    }

    if (config.imageRules) {
        config.imageRules.forEach((rule, index) => {
            if (!rule.placeholder) errors.push(`Image rule ${index}: Missing placeholder`);
            if (!rule.imageUrl) errors.push(`Image rule ${index}: Missing imageUrl`);
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    evaluateCondition,
    processConditionalContent,
    insertDynamicImages,
    mergeFields,
    generateAttachmentMetadata,
    personalizeEmail,
    createConditionalBlock,
    createImageRule,
    createAttachmentRule,
    validatePersonalizationConfig
};
