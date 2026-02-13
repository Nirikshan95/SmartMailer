import React from 'react';
import { useDashboard } from './DashboardContext';
import { Link } from 'react-router-dom';
import { Users, Mail, CheckCircle, AlertCircle, TrendingUp, Plus, FileText, Send, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Enhanced Stat Card Component
const StatCard = ({ title, value, subtext, icon: Icon, color, bgColor, progress }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ backgroundColor: bgColor }}>
            <Icon size={24} color={color} />
        </div>
        <div className="stat-content">
            <p className="stat-label">{title}</p>
            <h3 className="stat-value">{value}</h3>
            {subtext && <p className="stat-subtext">{subtext}</p>}
            {progress !== undefined && (
                <div className="progress-container">
                    <div
                        className="progress-bar"
                        style={{
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: color
                        }}
                    />
                </div>
            )}
        </div>
    </div>
);

const Overview = () => {
    const { emailList, completedEmails, emailStats, campaigns } = useDashboard();

    // Calculate metrics
    const dailyLimitPercent = (emailStats.emailsToday / emailStats.maxPerDay) * 100;
    const hourlyLimitPercent = (emailStats.emailsThisHour / emailStats.maxPerHour) * 100;

    // Format history data for chart
    const chartData = emailStats.history?.map(item => ({
        name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
        emails: item.count
    })).reverse() || [];

    // Add today if not in history
    if (chartData.length < 7) {
        chartData.push({
            name: 'Today',
            emails: emailStats.emailsToday
        });
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome back, User 👋</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Here's what's happening with your campaigns today.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                        padding: '6px 12px',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <CheckCircle size={14} /> System Operational
                    </span>
                </div>
            </div>

            {/* Stat Cards Row */}
            <div className="stat-grid">
                <StatCard
                    title="Total Prospects"
                    value={emailList.length + completedEmails.length}
                    subtext="Across all lists"
                    icon={Users}
                    color="#4f46e5"
                    bgColor="#eef2ff"
                />
                <StatCard
                    title="Campaign Success"
                    value={`${completedEmails.length}`}
                    subtext="Emails delivered safely"
                    icon={CheckCircle}
                    color="#10b981"
                    bgColor="#ecfdf5"
                />
                <StatCard
                    title="Daily Limit"
                    value={`${emailStats.emailsToday} / ${emailStats.maxPerDay}`}
                    subtext={`${Math.round(dailyLimitPercent)}% used today`}
                    icon={TrendingUp}
                    color="#f59e0b"
                    bgColor="#fffbeb"
                    progress={dailyLimitPercent}
                />
                <StatCard
                    title="Hourly Velocity"
                    value={`${emailStats.emailsThisHour} / ${emailStats.maxPerHour}`}
                    subtext="Emails this hour"
                    icon={Clock}
                    color="#ef4444"
                    bgColor="#fef2f2"
                    progress={hourlyLimitPercent}
                />
            </div>

            {/* Main Content Grid */}
            <div className="overview-grid">
                {/* Left Column: Analytics Chart */}
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--secondary-color)', margin: 0 }}>
                            Sending Activity
                        </h2>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Last 7 Days</span>
                    </div>

                    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="emails"
                                    fill="var(--primary-color)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Quick Actions & Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Quick Actions */}
                    <div className="card">
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--secondary-color)', marginBottom: '16px' }}>
                            Quick Actions
                        </h2>
                        <div className="quick-actions-grid">
                            <Link to="/dashboard/campaigns" className="action-btn">
                                <div className="action-btn-icon">
                                    <Plus size={24} />
                                </div>
                                New Campaign
                            </Link>
                            <Link to="/dashboard/prospects" className="action-btn">
                                <div className="action-btn-icon">
                                    <Users size={24} />
                                </div>
                                Add Prospects
                            </Link>
                            <Link to="/dashboard/templates" className="action-btn">
                                <div className="action-btn-icon">
                                    <FileText size={24} />
                                </div>
                                Templates
                            </Link>
                            <Link to="/dashboard/analytics" className="action-btn">
                                <div className="action-btn-icon">
                                    <TrendingUp size={24} />
                                </div>
                                View Reports
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Recent Activity */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--secondary-color)', margin: 0 }}>
                        Recent Activity
                    </h2>
                    <Link to="/dashboard/analytics" style={{ fontSize: '14px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>
                        View All
                    </Link>
                </div>

                {completedEmails.length > 0 ? (
                    <div>
                        {completedEmails.slice(-5).reverse().map((email, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-icon">
                                    <Send size={20} />
                                </div>
                                <div className="activity-content">
                                    <h4 className="activity-title">Email sent to {email.email}</h4>
                                    <div className="activity-meta">
                                        <span>Subject: {email.subject}</span>
                                        <span>•</span>
                                        <span>{email.sentAt}</span>
                                    </div>
                                </div>
                                <div className="activity-status">
                                    <span className="text-success" style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '12px' }}>
                                        Delivered
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                        <Mail size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <p>No recent activity to show.</p>
                        <p style={{ fontSize: '13px' }}>Start a campaign to see live updates here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Overview;
