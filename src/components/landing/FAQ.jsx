import React from 'react';

const FAQ = () => {
    const faqs = [
        {
            q: "Will my Gmail get blocked?",
            a: "No. SmartMailer respects Gmail's daily sending limits (500 emails/day for free accounts) and adds delays between emails to mimic human behavior."
        },
        {
            q: "How many emails can I send per day?",
            a: "You can send up to 500 emails per day with a standard Gmail account. Workspace accounts may have higher limits."
        },
        {
            q: "Is SmartMailer storing my contacts?",
            a: "Your contacts are processed securely. We do not sell your data. You can delete your uploaded lists at any time."
        },
        {
            q: "Do I need technical skills?",
            a: "Not at all! If you can use Gmail, you can use SmartMailer. It's designed to be intuitive and user-friendly."
        },
        {
            q: "Is this allowed by Google?",
            a: "Yes, we use the official Gmail API and adhere to all of Google's usage policies."
        }
    ];

    return (
        <section id="faq" className="section section-alt">
            <div className="landing-container">
                <h2 className="landing-h2">Frequently Asked Questions</h2>
                <div style={{ maxWidth: '800px', margin: '3rem auto 0' }}>
                    {faqs.map((faq, index) => (
                        <div key={index} style={{ marginBottom: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h3 className="landing-h3" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{faq.q}</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
