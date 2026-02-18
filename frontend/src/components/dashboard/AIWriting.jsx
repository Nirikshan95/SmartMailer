import React, { useState } from 'react';
import { Sparkles, FileText, Send } from 'lucide-react';

const AIWriting = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedEmail, setGeneratedEmail] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateEmail = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/ai-email/generate-from-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    recipientData: { name: 'John Doe', company: 'Acme Corp' },
                    senderData: { sender_name: 'Jane Smith', title: 'Sales Manager', company_name: 'Tech Solutions' }
                })
            });
            const data = await response.json();
            setGeneratedEmail(data);
        } catch (error) {
            console.error('Error generating email:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>AI Email Writing</h1>
                <p>Generate personalized email content with AI</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Generate Email</h2>
                </div>
                <div className="card-body">
                    <textarea
                        className="form-control"
                        placeholder="Describe the email you want to generate (e.g., 'Write a follow-up email to a prospect about our new product')..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                    />
                    <button 
                        className="btn btn-primary"
                        onClick={generateEmail}
                        disabled={loading}
                    >
                        <Sparkles className={loading ? 'spin' : ''} size={16} />
                        {loading ? 'Generating...' : 'Generate Email'}
                    </button>
                </div>
            </div>

            {generatedEmail && (
                <div className="card">
                    <div className="card-header">
                        <h2>Generated Email</h2>
                    </div>
                    <div className="card-body">
                        <div className="email-preview">
                            <div className="email-subject">
                                <strong>Subject:</strong> {generatedEmail.subject}
                            </div>
                            <div className="email-body">
                                {generatedEmail.body}
                            </div>
                            <div className="email-meta">
                                <span>Template: {generatedEmail.template}</span>
                                <span>Tone: {generatedEmail.tone}</span>
                                <span>Word Count: {generatedEmail.wordCount}</span>
                            </div>
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
                        <li>✓ Personalized email template writing with AI</li>
                        <li>✓ Multiple email templates (introduction, follow-up, sales pitch, etc.)</li>
                        <li>✓ Different tone styles (professional, friendly, casual)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AIWriting;
