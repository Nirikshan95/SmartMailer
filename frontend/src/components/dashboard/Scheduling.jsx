import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Pause, Plus, Trash2 } from 'lucide-react';

const Scheduling = () => {
    const [scheduledEmails, setScheduledEmails] = useState([]);
    const [schedulerRunning, setSchedulerRunning] = useState(false);

    useEffect(() => {
        loadScheduledEmails();
    }, []);

    const loadScheduledEmails = async () => {
        try {
            const response = await fetch('/api/scheduled-emails');
            const data = await response.json();
            setScheduledEmails(data.scheduledEmails || []);
        } catch (error) {
            console.error('Error loading scheduled emails:', error);
        }
    };

    const startScheduler = async () => {
        try {
            await fetch('/api/scheduler/start', { method: 'POST' });
            setSchedulerRunning(true);
        } catch (error) {
            console.error('Error starting scheduler:', error);
        }
    };

    const stopScheduler = async () => {
        try {
            await fetch('/api/scheduler/stop', { method: 'POST' });
            setSchedulerRunning(false);
        } catch (error) {
            console.error('Error stopping scheduler:', error);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Native Scheduling</h1>
                <p>Schedule emails for future sending with staggered intervals</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Scheduler Control</h2>
                </div>
                <div className="card-body">
                    <div className="scheduler-controls">
                        <button 
                            className={`btn ${schedulerRunning ? 'btn-danger' : 'btn-primary'}`}
                            onClick={schedulerRunning ? stopScheduler : startScheduler}
                        >
                            {schedulerRunning ? <><Pause size={16} /> Stop Scheduler</> : <><Play size={16} /> Start Scheduler</>}
                        </button>
                        <span className={`status ${schedulerRunning ? 'active' : 'inactive'}`}>
                            {schedulerRunning ? 'Running' : 'Stopped'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Scheduled Emails ({scheduledEmails.length})</h2>
                </div>
                <div className="card-body">
                    {scheduledEmails.length === 0 ? (
                        <p className="text-muted">No scheduled emails</p>
                    ) : (
                        <div className="email-list">
                            {scheduledEmails.map(email => (
                                <div key={email.id} className="email-item">
                                    <div className="email-info">
                                        <strong>{email.subject}</strong>
                                        <span className="email-recipient">To: {email.recipient?.email}</span>
                                        <span className="email-time">
                                            Scheduled: {new Date(email.scheduledTime).toLocaleString()}
                                        </span>
                                    </div>
                                    <span className={`status-badge ${email.status}`}>{email.status}</span>
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
                        <li>✓ Schedule emails for future sending</li>
                        <li>✓ Support staggered sending intervals</li>
                        <li>✓ Pace sending to avoid spam filter triggers</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Scheduling;
