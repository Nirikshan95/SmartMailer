const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// In a real scenario, this should be an RSA Public Key. 
// For simplicity in this "no-server" setup, we might use a shared secret (HMAC) 
// IF the user keeps the secret safe. But RSA is better so the app only needs the Public Key.
// We will assume the user provides a PUBLIC KEY in .env or we read it from a file.
// For this implementation, we'll use a simple secret from .env for demonstration, 
// but recommend RSA for production.
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'default_insecure_secret_do_not_use_in_prod';

/**
 * Verify the license key and return the decoded payload.
 * @param {string} token - The JWT license key.
 * @returns {object} - The decoded license data (plan, limits).
 */
function verifyLicense(token) {
    try {
        // Verify the token
        const decoded = jwt.verify(token, LICENSE_SECRET);
        return {
            valid: true,
            data: decoded
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

/**
 * (Dev Tool) Generate a license key.
 * This should be moved to a separate admin script, but keeping helper here for reference.
 */
function generateLicense(payload) {
    return jwt.sign(payload, LICENSE_SECRET, { expiresIn: '365d' }); // 1 year validity example
}

module.exports = {
    verifyLicense,
    generateLicense
};
