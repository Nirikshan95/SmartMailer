const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Attachment configuration
const attachmentConfig = {
    maxFileSize: 25 * 1024 * 1024, // 25MB default
    maxInlineImageSize: 5 * 1024 * 1024, // 5MB for inline images
    allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'text/csv'
    ],
    inlineImageFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// File size validation
function validateFileSize(fileSize) {
    if (fileSize > attachmentConfig.maxFileSize) {
        return {
            valid: false,
            error: `File size exceeds maximum of ${attachmentConfig.maxFileSize / (1024 * 1024)}MB`
        };
    }
    return { valid: true };
}

// MIME type validation
function validateMimeType(mimeType) {
    if (!attachmentConfig.allowedMimeTypes.includes(mimeType)) {
        return {
            valid: false,
            error: `File type ${mimeType} is not allowed`
        };
    }
    return { valid: true };
}

// Check if file can be embedded inline
function canEmbedInline(mimeType) {
    return attachmentConfig.inlineImageFormats.includes(mimeType);
}

// Convert file to base64 for inline embedding
function fileToBase64(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        return fileBuffer.toString('base64');
    } catch (error) {
        console.error('Error reading file:', error);
        return null;
    }
}

// Generate content ID for inline images
function generateContentId() {
    return crypto.randomBytes(16).toString('hex');
}

// Embed image as inline attachment
function embedInlineImage(imagePath, fileName) {
    try {
        const base64Data = fileToBase64(imagePath);
        if (!base64Data) {
            return null;
        }

        const contentId = generateContentId();

        return {
            filename: fileName,
            content: base64Data,
            encoding: 'base64',
            cid: contentId,
            contentType: 'image/png'
        };
    } catch (error) {
        console.error('Error embedding inline image:', error);
        return null;
    }
}

// Prepare attachment for nodemailer
function prepareAttachment(attachmentData, recipientData = null) {
    const { filePath, fileName, mimeType, personalizeFilename = false } = attachmentData;

    // Personalize filename if enabled
    let finalFileName = fileName;
    if (personalizeFilename && recipientData) {
        const { name, company } = recipientData;
        const firstName = name ? name.split(' ')[0] : '';
        const lastName = name ? name.split(' ').slice(-1)[0] : '';
        
        finalFileName = fileName
            .replace('{{firstName}}', firstName)
            .replace('{{lastName}}', lastName)
            .replace('{{name}}', name || '')
            .replace('{{company}}', company || '');
    }

    // Check if file exists and get stats
    if (filePath && fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        // Validate file size
        const sizeValidation = validateFileSize(fileSize);
        if (!sizeValidation.valid) {
            return { error: sizeValidation.error };
        }

        // Read file content
        const fileContent = fs.readFileSync(filePath);

        return {
            filename: finalFileName,
            content: fileContent,
            contentType: mimeType
        };
    }

    // For URL-based attachments
    if (attachmentData.url) {
        return {
            filename: finalFileName,
            href: attachmentData.url
        };
    }

    return { error: 'Invalid attachment data' };
}

// Prepare inline image for embedding
function prepareInlineImage(imageData, recipientData = null) {
    const { filePath, mimeType, fileName } = imageData;

    // Check if can be embedded inline
    if (!canEmbedInline(mimeType)) {
        return { error: 'This image format cannot be embedded inline' };
    }

    // Get file stats
    if (filePath && fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        // Validate file size for inline images
        if (fileSize > attachmentConfig.maxInlineImageSize) {
            return { error: `Image size exceeds maximum of ${attachmentConfig.maxInlineImageSize / (1024 * 1024)}MB for inline embedding` };
        }

        // Embed as inline
        const inlineAttachment = embedInlineImage(filePath, fileName);
        if (!inlineAttachment) {
            return { error: 'Failed to embed image' };
        }

        return inlineAttachment;
    }

    return { error: 'Invalid image data' };
}

// Replace image placeholders with inline CID references
function replaceImagePlaceholders(htmlContent, inlineImages) {
    let processedContent = htmlContent;

    inlineImages.forEach(img => {
        const placeholder = `{{inline:${img.filename}}}`;
        const cidReference = `cid:${img.cid}`;
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), cidReference);
    });

    return processedContent;
}

// Process all attachments for an email
function processAttachments(attachments, recipientData = null) {
    const regularAttachments = [];
    const inlineImages = [];

    if (!attachments || attachments.length === 0) {
        return { regularAttachments, inlineImages };
    }

    attachments.forEach(attachment => {
        const { type = 'attachment' } = attachment;

        if (type === 'inline') {
            const inlineImage = prepareInlineImage(attachment, recipientData);
            if (inlineImage && !inlineImage.error) {
                inlineImages.push(inlineImage);
            }
        } else {
            const regularAttachment = prepareAttachment(attachment, recipientData);
            if (regularAttachment && !regularAttachment.error) {
                regularAttachments.push(regularAttachment);
            }
        }
    });

    return { regularAttachments, inlineImages };
}

// Validate attachment configuration
function validateAttachmentConfig(config) {
    const errors = [];

    if (config.maxFileSize && config.maxFileSize > 50 * 1024 * 1024) {
        errors.push('Max file size cannot exceed 50MB');
    }

    if (config.maxInlineImageSize && config.maxInlineImageSize > 10 * 1024 * 1024) {
        errors.push('Max inline image size cannot exceed 10MB');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Get attachment configuration
function getAttachmentConfig() {
    return { ...attachmentConfig };
}

// Set attachment configuration
function setAttachmentConfig(newConfig) {
    const validation = validateAttachmentConfig(newConfig);
    if (!validation.valid) {
        return { success: false, errors: validation.errors };
    }

    Object.assign(attachmentConfig, newConfig);
    return { success: true, config: { ...attachmentConfig } };
}

// Check attachment limits for email sending
function checkAttachmentLimits(attachments) {
    let totalSize = 0;
    const errors = [];

    attachments.forEach(attachment => {
        if (attachment.filePath && fs.existsSync(attachment.filePath)) {
            const stats = fs.statSync(attachment.filePath);
            totalSize += stats.size;
        }
    });

    if (totalSize > attachmentConfig.maxFileSize) {
        errors.push(`Total attachment size exceeds ${attachmentConfig.maxFileSize / (1024 * 1024)}MB limit`);
    }

    return {
        valid: errors.length === 0,
        totalSize,
        errors
    };
}

module.exports = {
    validateFileSize,
    validateMimeType,
    canEmbedInline,
    fileToBase64,
    generateContentId,
    embedInlineImage,
    prepareAttachment,
    prepareInlineImage,
    replaceImagePlaceholders,
    processAttachments,
    validateAttachmentConfig,
    getAttachmentConfig,
    setAttachmentConfig,
    checkAttachmentLimits
};
