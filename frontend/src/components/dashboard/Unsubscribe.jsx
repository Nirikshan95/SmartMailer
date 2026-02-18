import React, { useState, useEffect } from 'react';
import { MailX, Users, Shield, FileText } from 'lucide-react';

const Unsubscribe = () => {
    const [stats, setStats] = useState({});
    const [suppressionList, setSuppressionList] = useState([]);

    useEffect(() => {
        loadStats();
        loadSuppressionList();
    }, []);

    const loadStats = async () => {
        try {
            const response = await fetch('/api/unsubscribe/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadSuppressionList = async () => {
        try {
            const response = await fetch('/api/unsubscribe/suppression-list');
            const data = await response.json();
            setSuppressionList(data.suppressionList || []);
        } catch (error) {
            console.error('Error loading suppression list:', error);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Unsubscribe Management</h1>
                <p>Manage email unsubscribes and suppression lists</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <Users className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Total Suppressed</div>
                        <div className="stat-value">{stats.totalSuppressed || 0}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <MailUnsubscribe className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Total Unsubscribes</div>
                        <div className="stat-value">{stats.totalUnsubscribes || 0}</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Suppression List ({suppressionList.length})</h2>
                </div>
                <div className="card-body">
                    {suppressionList.length === 0 ? (
                        <p className="text-muted">No suppressed emails</p>
                    ) : (
                        <div className="email-list">
                            {suppressionList.slice(0, 10).map((item, index) => (
                                <div key={index} className="email-item">
                                    <div className="email-info">
                                        <strong>{item.email}</strong>
                                        <span className="email-meta">
                                            Reason: {item.reason}
                                        </span>
                                        <span className="email-meta">
                                            Added: {new Date(item.addedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Features</h2>
                </div>
                <div className="card-body">
                    <ul className="feature-list">
                        <li>✓ Automatic unsubscribe link generation</li>
                        <li>✓ Unsubscribe request processing</li>
                        <li>✓ Compliance with CAN-SPAM and GDPR regulations</li>
                        <li>✓ Suppression list management</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Unsubscribe;
