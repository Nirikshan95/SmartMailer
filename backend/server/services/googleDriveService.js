const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
];
const TOKEN_PATH = path.join(__dirname, '../../tokens.json');

let oAuth2Client = null;
let drive = null;

/**
 * Initialize the Google Drive Service.
 */
function initialize() {
    const credentials = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback'
    };

    if (!credentials.client_id || !credentials.client_secret) {
        console.warn('Google Drive credentials not found in .env');
        return false;
    }

    oAuth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uri
    );

    // Load tokens if they exist
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);
        drive = google.drive({ version: 'v3', auth: oAuth2Client });
        console.log('Google Drive authenticated from local tokens.');
    }

    return true;
}

/**
 * Generate Auth URL.
 */
function getAuthUrl() {
    if (!oAuth2Client) initialize();
    if (!oAuth2Client) return null;
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
}

/**
 * Get tokens from code.
 */
async function getToken(code) {
    if (!oAuth2Client) initialize();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    drive = google.drive({ version: 'v3', auth: oAuth2Client });
    return tokens;
}

/**
 * Check if connected.
 */
function isConnected() {
    return !!drive;
}

/**
 * Find or Create a Folder.
 */
async function findOrCreateFolder(name, parentId = null) {
    if (!drive) throw new Error('Drive not connected');

    let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
    if (parentId) {
        query += ` and '${parentId}' in parents`;
    }

    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
    });

    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    }

    const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : []
    };

    const file = await drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    });
    return file.data.id;
}

/**
 * Save Secure Data to AppData Folder.
 */
async function saveSecureData(filename, data) {
    if (!drive) throw new Error('Drive not connected');

    // Check if file exists in appDataFolder
    const res = await drive.files.list({
        q: `name='${filename}' and trashed=false`,
        spaces: 'appDataFolder',
        fields: 'files(id, name)'
    });

    const fileMetadata = {
        name: filename,
        parents: ['appDataFolder']
    };

    const media = {
        mimeType: 'application/json',
        body: JSON.stringify(data)
    };

    if (res.data.files.length > 0) {
        // Update
        await drive.files.update({
            fileId: res.data.files[0].id,
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });
    } else {
        // Create
        await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });
    }
}

/**
 * Get Secure Data from AppData Folder.
 */
async function getSecureData(filename) {
    if (!drive) return null;

    const res = await drive.files.list({
        q: `name='${filename}' and trashed=false`,
        spaces: 'appDataFolder',
        fields: 'files(id, name)'
    });

    if (res.data.files.length === 0) return null;

    const fileId = res.data.files[0].id;
    const file = await drive.files.get({
        fileId: fileId,
        alt: 'media'
    });

    return file.data;
}

/**
 * List files.
 */
async function listFiles(query) {
    if (!drive) throw new Error('Drive not connected');
    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType)',
        spaces: 'drive'
    });
    return res.data.files;
}

/**
 * Upload a file.
 */
async function uploadFile(name, content, parentId, mimeType) {
    if (!drive) throw new Error('Drive not connected');

    const fileMetadata = {
        name: name,
        parents: parentId ? [parentId] : []
    };

    const media = {
        mimeType: mimeType,
        body: content
    };

    const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    });
    return file.data.id;
}

/**
 * Update a file.
 */
async function updateFile(fileId, content) {
    if (!drive) throw new Error('Drive not connected');

    const media = {
        mimeType: 'application/json', // Assuming JSON for now
        body: content
    };

    await drive.files.update({
        fileId: fileId,
        media: media
    });
}

/**
 * Get file content.
 */
async function getFile(fileId) {
    if (!drive) throw new Error('Drive not connected');
    const res = await drive.files.get({
        fileId: fileId,
        alt: 'media'
    });
    return res.data;
}

/**
 * Delete a file.
 */
async function deleteFile(fileId) {
    if (!drive) throw new Error('Drive not connected');
    await drive.files.delete({
        fileId: fileId
    });
}

module.exports = {
    initialize,
    getAuthUrl,
    getToken,
    isConnected,
    findOrCreateFolder,
    saveSecureData,
    getSecureData,
    listFiles,
    uploadFile,
    updateFile,
    getFile,
    deleteFile
};
