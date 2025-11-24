const { z } = require('zod');

// Schema for sending emails
const sendEmailSchema = z.object({
    smtpConfig: z.object({
        server: z.string().min(1, "SMTP server is required"),
        port: z.union([z.string(), z.number()]).transform(val => parseInt(val, 10)),
        email: z.string().email("Invalid SMTP email"),
        password: z.string().min(1, "SMTP password is required")
    }),
    recipient: z.object({
        email: z.string().email("Invalid recipient email"),
        name: z.string().optional()
    }),
    subject: z.string().min(1, "Subject is required"),
    htmlContent: z.string().min(1, "Email content is required")
});

// Schema for validating email lists
const validateEmailsSchema = z.object({
    emails: z.array(z.object({
        email: z.string(),
        // Allow other properties to pass through
    }).passthrough()).min(1, "At least one email is required"),
    useSSE: z.boolean().optional()
});

// Schema for updating email lists
const updateEmailListsSchema = z.object({
    completedEmails: z.array(z.any()).optional(),
    pendingEmails: z.array(z.any()).optional()
});

module.exports = {
    sendEmailSchema,
    validateEmailsSchema,
    updateEmailListsSchema
};
