import React, { useState } from 'react';
import { FileImage, FileText, Shield, Upload } from 'lucide-react';

const Attachments = () => {
    const [attachmentConfig, setAttachmentConfig] = useState({});
    const [fileSize, setFileSize] = useState(0);

    const loadConfig = async () => {
        try {
            const response = await fetch('/api/attachments/config');
            const data = await response.json();
            setAttachmentConfig(data.config);
        } catch (error) {
            console.error('Error loading config:', error);
        }
    };

    const validateSize = async () => {
        try {
            const response = await fetch('/api/attachments/validate-size', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileSize })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error validating size:', error);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Enhanced Attachment Support</h1>
                <p>Personalized attachments, inline images, and large file handling</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Attachment Configuration</h2>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label>Max File Size (MB)</label>
                        <div className="stat-value">{(attachmentConfig.maxFileSize / (1024 * 1024)).toFixed(0)}</div>
                    </div>
                    <div className="form-group">
                        <label>Max Inline Image Size (MB)</label>
                        <div className="stat-value">{(attachmentConfig.maxInlineImageSize / (1024 * 1024)).toFixed(0)}</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>File Size Validator</h2>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label>Test File Size (bytes)</label>
                        <input 
                            type="number" 
                            className="form-control"
                            value={fileSize}
                            onChange={(e) => setFileSize(parseInt(e.target.value))}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={validateSize}>
                        <Shield size={16} /> Validate
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Features</h2>
                </div>
                <div className="card-body">
                    <ul className="feature-list">
                        <li>✓ Personalized attachments per recipient</li>
                        <li>✓ Inline image embedding</li>
                        <li>✓ Large file handling (up to 25MB)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Attachments;
