import React, { useState } from 'react';

const Demo = () => {
    const [body, setBody] = useState('Hello {{name}},\n\nI noticed you are looking for a {{role}} at {{company}}.\n\nI would love to chat!');

    const preview = body
        .replace('{{name}}', 'Alex')
        .replace('{{role}}', 'Software Engineer')
        .replace('{{company}}', 'Google');

    return (
        <section id="demo" className="section section-alt">
            <div className="landing-container">
                <h2 className="landing-h2">Try It Yourself</h2>
                <p className="landing-text-lg" style={{ textAlign: 'center' }}>
                    See how easy it is to personalize your emails.
                </p>

                <div className="demo-container">
                    <div className="demo-header">
                        <div className="dot" style={{ background: '#ef4444' }}></div>
                        <div className="dot" style={{ background: '#eab308' }}></div>
                        <div className="dot" style={{ background: '#22c55e' }}></div>
                    </div>
                    <div className="demo-content">
                        <div className="demo-input">
                            <h3 className="landing-h3">Template</h3>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Type your email template here..."
                            />
                        </div>
                        <div className="demo-preview">
                            <h3 className="landing-h3">Preview</h3>
                            <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {preview}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Demo;
