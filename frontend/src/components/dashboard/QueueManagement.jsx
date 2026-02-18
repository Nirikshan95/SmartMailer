import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const QueueManagement = () => {
    const [queueData, setQueueData] = useState({
        pending: 0,
        processed: 0,
        sent: 0,
        failed: 0,
        duplicates: 0
    });
    const [loading, setLoading] = useState(false);

    const processQueue = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/process-queued-emails', {
                method: 'POST'
            });
            const data = await response.json();
            setQueueData(data);
        } catch (error) {
            console.error('Error processing queue:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load initial queue data
        processQueue();
    }, []);

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Queue Management</h1>
                <p>Manage emails queued due to rate limits</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <Clock className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Pending Emails</div>
                        <div className="stat-value">{queueData.pending}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <CheckCircle className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Sent</div>
                        <div className="stat-value">{queueData.sent}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <AlertCircle className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Failed</div>
                        <div className="stat-value">{queueData.failed}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <RefreshCw className="stat-icon" />
                    <div className="stat-content">
                        <div className="stat-label">Processed</div>
                        <div className="stat-value">{queueData.processed}</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Queue Actions</h2>
                </div>
                <div className="card-body">
                    <button 
                        className="btn btn-primary" 
                        onClick={processQueue}
                        disabled={loading}
                    >
                        <RefreshCw className={loading ? 'spin' : ''} size={16} />
                        {loading ? 'Processing...' : 'Process Queued Emails'}
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Features</h2>
                </div>
                <div className="card-body">
                    <ul className="feature-list">
                        <li>✓ Queue emails that exceed daily limits</li>
                        <li>✓ Auto-resume sending after quota reset</li>
                        <li>✓ Prevent duplicates with recipient tracking</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default QueueManagement;
