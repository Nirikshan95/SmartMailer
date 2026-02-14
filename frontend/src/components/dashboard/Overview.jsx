import React from 'react';
import { useDashboard } from './DashboardContext';
import { Link } from 'react-router-dom';
import { Users, Mail, CheckCircle, AlertCircle, TrendingUp, Plus, FileText, Send, Clock, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Modern Stylish Stat Card Component
const StatCard = ({ title, value, subtext, icon: Icon, color, progress, trend }) => (
    <div className="stat-card">
        <div className="stat-header">
            <div className="stat-icon-container">
                <div className="stat-icon-bg-offset" style={{ backgroundColor: color }}></div>
                <div className="stat-icon-wrapper">
                    <Icon size={20} color={color} />
                </div>
            </div>
            {trend && (
                <div className="stat-trend" style={{ color: color, backgroundColor: `${color}08`, borderColor: `${color}20` }}>
                    {trend}
                </div>
            )}
        </div>
        <div className="stat-value-container">
            <p className="stat-label">{title}</p>
            <h3 className="stat-value">{value}</h3>
            {subtext && <p className="stat-subtext">{subtext}</p>}

            {progress !== undefined && (
                <div className="progress-container" style={{ marginTop: '16px', height: '4px', backgroundColor: 'var(--border-color)', opacity: 0.6 }}>
                    <div
                        className="progress-bar"
                        style={{
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 8px ${color}20`
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

    // Calculate Reach Forecast
    const totalProspects = emailList.length + completedEmails.length;
    const dailyLimit = emailStats.maxPerDay || 400;
    const reachDays = totalProspects > 0 ? Math.ceil(totalProspects / dailyLimit) : 0;

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
                    subtext="Verified in pipeline"
                    icon={Users}
                    color="#4f46e5"
                />
                <StatCard
                    title="Campaign Success"
                    value={`${completedEmails.length}`}
                    subtext="Safety Check Passed"
                    icon={CheckCircle}
                    color="#10b981"
                />
                <StatCard
                    title="Daily Limit"
                    value={`${emailStats.emailsToday} / ${emailStats.maxPerDay}`}
                    subtext={`${Math.round(dailyLimitPercent)}% capacity`}
                    icon={TrendingUp}
                    color="#f59e0b"
                    progress={dailyLimitPercent}
                />
                <StatCard
                    title="Hourly Velocity"
                    value={`${emailStats.emailsThisHour} / ${emailStats.maxPerHour}`}
                    subtext="Processing updates"
                    icon={Clock}
                    color="#ef4444"
                    progress={hourlyLimitPercent}
                />
            </div>

            {/* Main Content Grid */}
            <div className="overview-grid">
                {/* Left Column: Analytics Chart */}
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                    {/* Quick Actions */}
                    <div className="card" style={{ flex: 1.5, marginBottom: 0, padding: '20px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--secondary-color)', marginBottom: '14px' }}>
                            Quick Actions
                        </h2>
                        <div className="quick-actions-grid" style={{
                            flex: 1,
                            gap: '10px',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            minHeight: 0,
                            display: 'grid'
                        }}>
                            <Link to="/dashboard/campaigns" className="action-btn" style={{
                                padding: '12px 8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                gap: '6px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <div className="action-btn-icon" style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#dcfce7',
                                    color: '#059669',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Plus size={18} />
                                </div>
                                <span style={{ whiteSpace: 'nowrap' }}>New Campaign</span>
                            </Link>
                            <Link to="/dashboard/prospects" className="action-btn" style={{
                                padding: '12px 8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                gap: '6px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <div className="action-btn-icon" style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#e0e7ff',
                                    color: '#4f46e5',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Users size={18} />
                                </div>
                                <span style={{ whiteSpace: 'nowrap' }}>Add Prospects</span>
                            </Link>
                            <Link to="/dashboard/templates" className="action-btn" style={{
                                padding: '12px 8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                gap: '6px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <div className="action-btn-icon" style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#fef3c7',
                                    color: '#d97706',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FileText size={18} />
                                </div>
                                <span style={{ whiteSpace: 'nowrap' }}>Templates</span>
                            </Link>
                            <Link to="/dashboard/analytics" className="action-btn" style={{
                                padding: '12px 8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                gap: '6px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <div className="action-btn-icon" style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#fae8ff',
                                    color: '#a21caf',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <TrendingUp size={18} />
                                </div>
                                <span style={{ whiteSpace: 'nowrap' }}>Reports</span>
                            </Link>
                        </div>
                    </div>

                    {/* Reach Forecast */}
                    <div className="card" style={{
                        flex: 0.5,
                        marginBottom: 0,
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        minHeight: 0,
                        backgroundColor: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                            <h2 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Reach Forecast
                            </h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '30px', fontWeight: '800', color: 'var(--primary-color)', lineHeight: 1 }}>{reachDays}</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Days</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.2' }}>
                            Pipeline lasts for <strong>{reachDays} days</strong>
                        </p>
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
