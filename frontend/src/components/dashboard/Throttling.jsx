import React, { useState, useEffect } from 'react';
import { Zap, Shield, AlertTriangle, Activity } from 'lucide-react';

const Throttling = () => {
    const [throttlingConfig, setThrottlingConfig] = useState({});
    const [throttlingStatus, setThrottlingStatus] = useState({});

    useEffect(() => {
        loadThrottlingConfig();
        loadThrottlingStatus();
    }, []);

    const loadThrottlingConfig = async () => {
        try {
            const response = await fetch('/api/throttling/config');
            const data = await response.json();
            setThrottlingConfig(data.config);
        } catch (error) {
            console.error('Error loading config:', error);
        }
    };

    const loadThrottlingStatus = async () => {
        try {
            const response = await fetch('/api/throttling/status');
            const data = await response.json();
            setThrottlingStatus(data);
        } catch (error) {
            console.error('Error loading status:', error);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Smart Throttling & Spam Prevention</h1>
                <p>Rate limiting and spam protection for email sending</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <Zap className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Max Per Day</div>
                        <div className="stat-value">{throttlingConfig.maxPerDay || 500}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <Activity className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Max Per Hour</div>
                        <div className="stat-value">{throttlingConfig.maxPerHour || 50}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <Shield className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Spam Threshold</div>
                        <div className="stat-value">{throttlingConfig.spamScoreThreshold || 5}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <AlertTriangle className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Stagger Interval</div>
                        <div className="stat-value">{throttlingConfig.staggerInterval || 2000}ms</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Throttling Status</h2>
                </div>
                <div className="card-body">
                    <div className="status-item">
                        <span className="status-label">Rate Limits:</span>
                        <span className={`status-badge ${throttlingStatus.rateLimits?.allowed ? 'success' : 'warning'}`}>
                            {throttlingStatus.rateLimits?.allowed ? 'Allowed' : 'Limited'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Cooldown:</span>
                        <span className={`status-badge ${throttlingStatus.cooldown?.inCooldown ? 'warning' : 'success'}`}>
                            {throttlingStatus.cooldown?.inCooldown ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Burst Count:</span>
                        <span className="status-value">{throttlingStatus.burst?.count || 0}/{throttlingStatus.burst?.limit || 10}</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Features</h2>
                </div>
                <div className="card-body">
                    <ul className="feature-list">
                        <li>✓ Rate limiting to prevent Gmail throttling</li>
                        <li>✓ Staggered sending patterns</li>
                        <li>✓ Spam score checking before sending</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Throttling;
