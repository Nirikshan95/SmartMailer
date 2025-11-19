import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing = () => {
    return (
        <section id="pricing" className="section pricing-section">
            <div className="landing-container">
                <h2 className="landing-h2">Simple Pricing</h2>
                <p className="landing-text-lg text-center">
                    Start for free, upgrade when you scale. No hidden fees.
                </p>

                <div className="pricing-grid">
                    {/* Starter Plan */}
                    <div className="pricing-card">
                        <h3 className="landing-h3">Starter</h3>
                        <div className="price">
                            $0 <span className="price-period">/mo</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Perfect for individuals and hobbyists.
                        </p>
                        <ul className="feature-list">
                            <li><Check size={20} color="var(--success-color)" /> 500 emails/day</li>
                            <li><Check size={20} color="var(--success-color)" /> Basic Templates</li>
                            <li><Check size={20} color="var(--success-color)" /> 1,000 Contacts</li>
                        </ul>
                        <Link to="/app" className="btn btn-outline w-full">
                            Get Started
                        </Link>
                    </div>

                    {/* Pro Plan - Highlighted */}
                    <div className="pricing-card featured">
                        <div className="pricing-badge">
                            MOST POPULAR
                        </div>
                        <h3 className="landing-h3">Pro</h3>
                        <div className="price">
                            $29 <span className="price-period">/mo</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            For growing businesses and power users.
                        </p>
                        <ul className="feature-list">
                            <li><Check size={20} color="var(--success-color)" /> Unlimited Emails (SMTP)</li>
                            <li><Check size={20} color="var(--success-color)" /> AI Writing Assistant</li>
                            <li><Check size={20} color="var(--success-color)" /> Advanced Analytics</li>
                            <li><Check size={20} color="var(--success-color)" /> Priority Support</li>
                        </ul>
                        <Link to="/app" className="btn btn-primary w-full">
                            Start Free Trial
                        </Link>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="pricing-card">
                        <h3 className="landing-h3">Enterprise</h3>
                        <div className="price">
                            Custom
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            For large teams and high volume needs.
                        </p>
                        <ul className="feature-list">
                            <li><Check size={20} color="var(--success-color)" /> Dedicated IP</li>
                            <li><Check size={20} color="var(--success-color)" /> SSO & Advanced Security</li>
                            <li><Check size={20} color="var(--success-color)" /> Custom Integrations</li>
                            <li><Check size={20} color="var(--success-color)" /> SLA Guarantee</li>
                        </ul>
                        <button className="btn btn-outline w-full">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
