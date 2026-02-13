import React from 'react';
import { Lock, Shield, Database } from 'lucide-react';

const Security = () => {
    return (
        <section className="section section-alt">
            <div className="landing-container">
                <h2 className="landing-h2">Security First</h2>
                <p className="landing-text-lg" style={{ textAlign: 'center' }}>
                    Your data and privacy are our top priority.
                </p>

                <div className="grid-3">
                    <div style={{ textAlign: 'center' }}>
                        <div className="icon-box" style={{ margin: '0 auto 1rem' }}><Lock size={24} /></div>
                        <h3 className="landing-h3">Google OAuth Verified</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>We use secure Google login. We never see or store your password.</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div className="icon-box" style={{ margin: '0 auto 1rem' }}><Shield size={24} /></div>
                        <h3 className="landing-h3">Direct Sending</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Emails are sent directly through your Gmail account, ensuring high deliverability.</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div className="icon-box" style={{ margin: '0 auto 1rem' }}><Database size={24} /></div>
                        <h3 className="landing-h3">Data Encryption</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>All your contact data is encrypted and you can delete it at any time.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Security;
