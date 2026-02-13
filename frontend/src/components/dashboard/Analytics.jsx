import React, { useState, useMemo } from 'react';
import { useDashboard } from './DashboardContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, BarChart2, Calendar, Download, TrendingUp, TrendingDown, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const Analytics = () => {
    const { emailStats, campaigns } = useDashboard();
    const [dateRange, setDateRange] = useState('7d'); // '7d', '30d', 'all'

    // Colors
    const COLORS = ['#10b981', '#ef4444', '#f59e0b']; // Success, Failed, Pending

    // Filter History Data
    const chartData = useMemo(() => {
        if (!emailStats.history) return [];

        let days = 7;
        if (dateRange === '30d') days = 30;
        if (dateRange === 'all') days = 365; // Logical cap

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return emailStats.history
            .filter(item => new Date(item.date) >= cutoff)
            .map(item => ({
                name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: new Date(item.date).toLocaleDateString(),
                emails: item.count
            }))
            // History is likely newest first or oldest? usually strictly ordered. 
            // Assuming server returns correctly ordered or we sort.
            .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

    }, [emailStats.history, dateRange]);

    // Aggregate Campaign Stats
    const campaignStats = useMemo(() => {
        if (!campaigns) return { sent: 0, failed: 0, pending: 0, total: 0 };
        return campaigns.reduce((acc, camp) => {
            const stats = camp.stats || { sent: 0, failed: 0, pending: 0 };
            acc.sent += stats.sent || 0;
            acc.failed += stats.failed || 0;
            acc.pending += stats.pending || 0;
            // acc.total += (stats.sent + stats.failed + stats.pending); // Or use specific total count if available
            return acc;
        }, { sent: 0, failed: 0, pending: 0 });
    }, [campaigns]);

    const pieData = [
        { name: 'Sent', value: campaignStats.sent },
        { name: 'Failed', value: campaignStats.failed },
        { name: 'Pending', value: campaignStats.pending }
    ].filter(d => d.value > 0);

    const handleExport = () => {
        const headers = ['Date', 'Emails Sent'];
        const rows = chartData.map(d => [d.fullDate, d.emails]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `analytics_report_${dateRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Deep Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Analyze your campaign performance & sending trends</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="input-group" style={{ marginBottom: 0, width: '150px' }}>
                        <select
                            className="select"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            style={{ height: '40px' }}
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <button className="btn btn-outline" onClick={handleExport}>
                        <Download size={18} /> Export Report
                    </button>
                </div>
            </div>

            {/* Insight Cards */}
            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#eef2ff' }}>
                        <Mail size={24} color="#4f46e5" />
                    </div>
                    <div>
                        <p className="stat-label">Total Volume</p>
                        <h3 className="stat-value">{chartData.reduce((a, b) => a + b.emails, 0)}</h3>
                        <p className="stat-subtext text-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={12} /> +12% vs last period
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#ecfdf5' }}>
                        <CheckCircle size={24} color="#10b981" />
                    </div>
                    <div>
                        <p className="stat-label">Success Rate</p>
                        <h3 className="stat-value">
                            {campaignStats.sent + campaignStats.failed > 0
                                ? Math.round((campaignStats.sent / (campaignStats.sent + campaignStats.failed)) * 100)
                                : 0}%
                        </h3>
                        <p className="stat-subtext" style={{ color: 'var(--text-secondary)' }}>
                            Global Average
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#fff7ed' }}>
                        <Activity size={24} color="#f97316" />
                    </div>
                    <div>
                        <p className="stat-label">Active Campaigns</p>
                        <h3 className="stat-value">
                            {campaigns.filter(c => c.status !== 'Completed').length}
                        </h3>
                        <p className="stat-subtext" style={{ color: 'var(--text-secondary)' }}>
                            {campaigns.length} Total Campaigns
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="overview-grid">
                {/* Area Trend Chart */}
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>Sending Volume Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Area type="monotone" dataKey="emails" stroke="var(--primary-color)" strokeWidth={2} fillOpacity={1} fill="url(#colorEmails)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart & Limits */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Pie */}
                    <div className="card" style={{ flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Campaign Distribution</h3>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>No Data</div>
                        )}
                    </div>

                    {/* Limits Mini-Card */}
                    <div className="card" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'Bold', marginBottom: '12px' }}>Live Limits</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Daily</span>
                            <span>{emailStats.emailsToday} / {emailStats.maxPerDay}</span>
                        </div>
                        <div className="progress-container" style={{ marginBottom: '12px' }}>
                            <div className="progress-bar" style={{ width: `${Math.min(100, (emailStats.emailsToday / emailStats.maxPerDay) * 100)}%`, backgroundColor: 'var(--primary-color)' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Performance Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Campaign Performance</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Campaign Name</th>
                            <th>Status</th>
                            <th>Sent</th>
                            <th>Failed</th>
                            <th>Pending</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map(c => {
                            const total = (c.stats?.sent || 0) + (c.stats?.failed || 0) + (c.stats?.pending || 0);
                            const progress = total > 0 ? ((c.stats?.sent || 0) / total) * 100 : 0;

                            return (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                            backgroundColor: c.status === 'Completed' ? '#ecfdf5' : c.status === 'Draft' ? '#f3f4f6' : '#fffbeb',
                                            color: c.status === 'Completed' ? '#059669' : c.status === 'Draft' ? '#4b5563' : '#d97706'
                                        }}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td>{c.stats?.sent || 0}</td>
                                    <td className="text-error">{c.stats?.failed || 0}</td>
                                    <td>{c.stats?.pending || 0}</td>
                                    <td style={{ width: '20%' }}>
                                        <div className="progress-container" style={{ marginTop: 0, height: '6px' }}>
                                            <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: 'var(--success-color)' }}></div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>No campaigns found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Analytics;
