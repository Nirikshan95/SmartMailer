require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../config.json');
let config = {};

try {
    if (fs.existsSync(CONFIG_FILE)) {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
} catch (error) {
    console.error('Failed to load config.json:', error);
}

// Merge with env vars if needed, or just export as is
module.exports = {
    ...config,
    port: process.env.PORT || 3001,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
