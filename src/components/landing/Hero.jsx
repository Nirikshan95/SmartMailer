import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

const Hero = () => {
    return (
        <section className="hero-section">
            <div className="landing-container">
                <div className="hero-tagline">
                    ✨ No servers. No SMTP setup. No technical knowledge needed.
                </div>
                <h1 className="landing-h1">
                    Send Personalized Emails in Bulk<br />
                    <span style={{ color: 'var(--primary-color)' }}>Smart, Fast & Free.</span>
                </h1>
                <p className="landing-text-lg">
                    Designed for creators, students, freelancers & job seekers using Gmail.
                    Scale your outreach without the complexity.
                </p>
                <div className="hero-buttons">
                    <a href="http://localhost:3001/auth/google" className="btn btn-primary">
                        Start Now <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                    </a>
                    <a href="#demo" className="btn btn-outline">
                        Try Demo <Play size={20} style={{ marginLeft: '8px' }} />
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Hero;
