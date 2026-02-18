import React, { useState } from 'react';
import { FileImage, Code, Layers } from 'lucide-react';

const Personalization = () => {
    const [htmlContent, setHtmlContent] = useState('');
    const [recipientData, setRecipientData] = useState({
        name: 'John Smith',
        company: 'Acme Corp',
        title: 'Manager'
    });
    const [personalizedContent, setPersonalizedContent] = useState('');

    const personalize = async () => {
        try {
            const response = await fetch('/api/personalization/personalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    htmlContent,
                    recipientData,
                    personalizationConfig: {
                        conditionalBlocks: [],
                        imageRules: [],
                        attachmentRules: [],
                        customFields: {}
                    }
                })
            });
            const data = await response.json();
            setPersonalizedContent(data.htmlContent);
        } catch (error) {
            console.error('Error personalizing:', error);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Advanced Personalization</h1>
                <p>Conditional content, dynamic images, and multi-field merging</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Personalize Email</h2>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label>Recipient Name</label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={recipientData.name}
                            onChange={(e) => setRecipientData({...recipientData, name: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Company</label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={recipientData.company}
                            onChange={(e) => setRecipientData({...recipientData, company: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Content</label>
                        <textarea 
                            className="form-control"
                            placeholder="Enter your email content with placeholders like {{name}}, {{company}}..."
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                            rows={6}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={personalize}>
                        <Layers size={16} /> Personalize
                    </button>
                </div>
            </div>

            {personalizedContent && (
                <div className="card">
                    <div className="card-header">
                        <h2>Personalized Result</h2>
                    </div>
                    <div className="card-body">
                        <div className="email-preview">
                            {personalizedContent}
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h2>Features</h2>
                </div>
                <div className="card-body">
                    <ul className="feature-list">
                        <li>✓ Support for conditional content logic</li>
                        <li>✓ Dynamic image insertion</li>
                        <li>✓ Personalized attachment support</li>
                        <li>✓ Multi-field data merging</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Personalization;
