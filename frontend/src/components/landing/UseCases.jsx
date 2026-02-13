import React from 'react';

const UseCases = () => {
    const cases = [
        {
            role: 'Job Seekers',
            action: 'Mass outreach to recruiters',
            example: '"Hi {{name}}, I saw your post for {{role}}..."'
        },
        {
            role: 'Students',
            action: 'Reaching out for internships',
            example: '"Professor {{name}}, I am interested in your research..."'
        },
        {
            role: 'Freelancers',
            action: 'Sending client pitches',
            example: '"I can help {{company}} improve its SEO..."'
        },
        {
            role: 'Creators',
            action: 'Sending newsletters',
            example: '"New video out! Check it out, {{name}}!"'
        }
    ];

    return (
        <section className="section">
            <div className="landing-container">
                <h2 className="landing-h2">Built For Everyone</h2>
                <div className="grid-2">
                    {cases.map((item, index) => (
                        <div key={index} style={{
                            padding: '1.5rem',
                            borderLeft: '4px solid var(--primary-color)',
                            background: 'var(--surface-color)',
                            borderRadius: '0 8px 8px 0'
                        }}>
                            <h3 className="landing-h3" style={{ marginBottom: '0.5rem' }}>{item.role}</h3>
                            <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>{item.action}</p>
                            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{item.example}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default UseCases;
