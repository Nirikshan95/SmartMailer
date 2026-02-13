import React from 'react';
import { UserPlus, Upload, PenTool, Send } from 'lucide-react';

const Workflow = () => {
    const steps = [
        {
            icon: <UserPlus size={24} />,
            title: 'Connect Gmail',
            desc: 'Secure OAuth login. No passwords stored.'
        },
        {
            icon: <Upload size={24} />,
            title: 'Upload Contacts',
            desc: 'Import CSV or Google Sheets instantly.'
        },
        {
            icon: <PenTool size={24} />,
            title: 'Compose & Personalize',
            desc: 'Use AI to write and variables like {{name}}.'
        },
        {
            icon: <Send size={24} />,
            title: 'Bulk Send',
            desc: 'Auto-scheduled within Gmail limits.'
        }
    ];

    return (
        <section id="how-it-works" className="section">
            <div className="landing-container">
                <h2 className="landing-h2">How SmartMailer Works</h2>
                <p className="landing-text-lg" style={{ textAlign: 'center' }}>
                    Start your campaign in minutes with our simple 4-step process.
                </p>

                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
                    {steps.map((step, index) => (
                        <div key={index} className="workflow-step">
                            <div className="step-number">{index + 1}</div>
                            <div className="icon-box" style={{ margin: '0 auto 1rem' }}>
                                {step.icon}
                            </div>
                            <h3 className="landing-h3">{step.title}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                        ✅ Uses Google-approved sending limits (no spam)
                    </span>
                </div>
            </div>
        </section>
    );
};

export default Workflow;
