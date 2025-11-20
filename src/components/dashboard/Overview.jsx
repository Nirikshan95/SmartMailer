import React from 'react';
import { useDashboard } from './DashboardContext';
import { Users, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: bgColor }}>
            <Icon size={24} color={color} />
        </div>
        <div>
            <p className="stat-label">{title}</p>
            <h3 className="stat-value">{value}</h3>
        </div>
    </div>
);

const Overview = () => {
    const { emailList, completedEmails, emailStats } = useDashboard();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard Overview</h1>
            </div>

            <div className="stat-grid">
                <StatCard
                    title="Total Prospects"
                    value={emailList.length + completedEmails.length}
                    icon={Users}
                    color="#4f46e5"
                    bgColor="#eef2ff"
                />
                <StatCard
                    title="Emails Sent"
                    value={completedEmails.length}
                    icon={CheckCircle}
                    color="#10b981"
                    bgColor="#ecfdf5"
                />
                <StatCard
                    title="Pending Emails"
                    value={emailList.length}
                    icon={Mail}
                    color="#f59e0b"
                    bgColor="#fffbeb"
                />
                <StatCard
                    title="Daily Limit Used"
                    value={`${emailStats.emailsToday}/${emailStats.maxPerDay}`}
                    icon={AlertCircle}
                    color="#ef4444"
                    bgColor="#fef2f2"
                />
            </div>

            <div className="card">
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--secondary-color)', marginBottom: '16px' }}>Recent Activity</h2>
                {completedEmails.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Subject</th>
                                    <th>Sent At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedEmails.slice(-5).reverse().map((email, index) => (
                                    <tr key={index}>
                                        <td>{email.email}</td>
                                        <td>{email.subject}</td>
                                        <td>{email.sentAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>No recent activity</p>
                )}
            </div>
        </div>
    );
};

export default Overview;
