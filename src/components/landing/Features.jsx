import React from 'react';
import { Wand2, Mail, Users, Calendar, BarChart2, ShieldCheck, BrainCircuit } from 'lucide-react';

const Features = () => {
    const features = [
        {
            icon: <Wand2 size={24} />,
            title: 'AI Email Generator',
            desc: 'Generate personalized emails for each contact automatically using advanced AI.'
        },
        {
            icon: <Mail size={24} />,
            title: 'Mail Merge',
            desc: 'Personalize every email with dynamic fields like {{name}}, {{company}}, and more.'
        },
        {
            icon: <ShieldCheck size={24} />,
            title: 'Safe Sending',
            desc: 'Smart throttling ensures you stay within Gmail limits and avoid spam folders.'
        },
        {
            icon: <Users size={24} />,
            title: 'Contact Management',
            desc: 'Easy upload and management of your contact lists from CSV files.'
        },
        {
            icon: <Calendar size={24} />,
            title: 'Smart Scheduling',
            desc: 'Schedule your campaigns to send at the perfect time for maximum open rates.'
        },
        {
            icon: <BarChart2 size={24} />,
            title: 'Status Tracking',
            desc: 'Track sent, failed, and success rates in real-time.'
        }
    ];

    return (
        <section id="features" className="section section-alt">
            <div className="landing-container">
                <h2 className="landing-h2">Everything You Need</h2>
                <p className="landing-text-lg" style={{ textAlign: 'center' }}>
                    Powerful features to supercharge your email outreach.
                </p>

                <div className="grid-3">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="icon-box">{feature.icon}</div>
                            <h3 className="landing-h3">{feature.title}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
