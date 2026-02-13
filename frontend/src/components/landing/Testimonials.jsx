import React from 'react';

const Testimonials = () => {
    const reviews = [
        {
            text: "I used SmartMailer to apply for 50+ internships and got 12 interviews! The personalization makes a huge difference.",
            author: "Sarah J.",
            role: "Student"
        },
        {
            text: "Perfect for sending client pitches. It saves me hours every week and the AI helps me sound more professional.",
            author: "Mike T.",
            role: "Freelance Designer"
        },
        {
            text: "Finally a free tool that actually works. No complex setup, just login and send.",
            author: "David L.",
            role: "Startup Founder"
        }
    ];

    return (
        <section className="section">
            <div className="landing-container">
                <h2 className="landing-h2">Loved by Users</h2>
                <div className="grid-3">
                    {reviews.map((review, index) => (
                        <div key={index} className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>"{review.text}"</p>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{review.author}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{review.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
