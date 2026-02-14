import { useState, useMemo } from 'react';
import { useDashboard } from './DashboardContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line } from 'recharts';
import { Activity, BarChart2, Download, TrendingUp, Mail, CheckCircle, Shield, AlertTriangle, Clock } from 'lucide-react';

const Analytics = () => {
    const { emailStats, campaigns } = useDashboard();
    const [dateRange, setDateRange] = useState('7d');

    // Mock data for Email Validation Metrics
    const validationMetrics = {
        bounceRateByDomain: [
            { domain: 'gmail.com', bounceRate: 2.3, emails: 1250 },
            { domain: 'outlook.com', bounceRate: 3.1, emails: 890 },
            { domain: 'yahoo.com', bounceRate: 5.8, emails: 620 },
            { domain: 'company.com', bounceRate: 1.2, emails: 450 },
            { domain: 'hotmail.com', bounceRate: 4.5, emails: 380 }
        ],
        validationSuccessRate: 94.7,
        invalidReasons: [
            { reason: 'Invalid Format', count: 45, color: '#ef4444' },
            { reason: 'No MX Record', count: 32, color: '#f59e0b' },
            { reason: 'Disposable Email', count: 28, color: '#f97316' },
            { reason: 'SMTP Failure', count: 18, color: '#dc2626' },
            { reason: 'Blocked Domain', count: 12, color: '#991b1b' }
        ],
        domainHealthTrend: [
            { date: 'Week 1', score: 92 },
            { date: 'Week 2', score: 94 },
            { date: 'Week 3', score: 91 },
            { date: 'Week 4', score: 95 }
        ]
    };

    // Format Data
    const chartData = useMemo(() => {
        if (!emailStats.history) return [];
        let days = dateRange === '30d' ? 30 : dateRange === 'all' ? 365 : 7;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return emailStats.history
            .filter(item => new Date(item.date) >= cutoff)
            .map(item => ({
                name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: new Date(item.date).toLocaleDateString(),
                emails: item.count
            }))
            .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    }, [emailStats.history, dateRange]);

    const hourlyData = [
        { time: '09:00', emails: 45 },
        { time: '10:00', emails: 82 },
        { time: '11:00', emails: 65 },
        { time: '12:00', emails: 95 },
        { time: '13:00', emails: 110 },
        { time: '14:00', emails: 88 },
        { time: '15:00', emails: 72 },
    ];

    const engagementTrends = [
        { day: 'Mon', rate: 42 },
        { day: 'Tue', rate: 55 },
        { day: 'Wed', rate: 48 },
        { day: 'Thu', rate: 72 },
        { day: 'Fri', rate: 68 },
        { day: 'Sat', rate: 50 },
        { day: 'Sun', rate: 62 },
    ];

    const campaignStats = useMemo(() => {
        if (!campaigns) return { sent: 0, failed: 0, pending: 0 };
        return campaigns.reduce((acc, camp) => {
            const stats = camp.stats || { sent: 0, failed: 0, pending: 0 };
            acc.sent += stats.sent || 0;
            acc.failed += stats.failed || 0;
            acc.pending += stats.pending || 0;
            return acc;
        }, { sent: 0, failed: 0, pending: 0 });
    }, [campaigns]);

    const pieData = [
        { name: 'Sent', value: campaignStats.sent, color: '#10b981' },
        { name: 'Pending', value: campaignStats.pending, color: '#f59e0b' },
        { name: 'Failed', value: campaignStats.failed, color: '#ef4444' }
    ].filter(d => d.value > 0);

    const handleExport = () => {
        const headers = ['Date', 'Emails Sent'];
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...chartData.map(d => [d.fullDate, d.emails].join(','))].join('\n');
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `analytics_report_${dateRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title">Deep Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Deep-dive into campaign performance & engagement trends</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select className="select" value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ width: '150px' }}>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                    <button className="btn btn-outline" onClick={handleExport}>
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Insight Stats */}
            <div className="stat-grid" style={{ marginBottom: '32px' }}>
                <div className="stat-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--primary-color)' }}>
                            <Mail size={24} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Volume</p>
                            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--secondary-color)', margin: 0 }}>{chartData.reduce((a, b) => a + b.emails, 0)}</h2>
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: '#10b981' }}>
                            <CheckCircle size={24} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Success Rate</p>
                            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#10b981', margin: 0 }}>
                                {campaignStats.sent + campaignStats.failed > 0 ? Math.round((campaignStats.sent / (campaignStats.sent + campaignStats.failed)) * 100) : 0}%
                            </h2>
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: '#f59e0b' }}>
                            <Activity size={24} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Active Reach</p>
                            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b', margin: 0 }}>{campaigns.filter(c => c.status !== 'Completed').length}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Sending Volume Trend */}
                    <div className="card" style={{ padding: '24px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>Sending Volume History</h3>
                            <BarChart2 size={18} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }} />
                                    <Area type="monotone" dataKey="emails" stroke="var(--primary-color)" strokeWidth={3} fill="url(#colorTrend)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Engagement Probability */}
                    <div className="card" style={{ padding: '24px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>Engagement Outlook</h3>
                            <TrendingUp size={18} style={{ color: '#10b981' }} />
                        </div>
                        <div style={{ height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={engagementTrends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }} />
                                    <Line type="step" dataKey="rate" stroke="var(--primary-color)" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Hourly Velocity */}
                    <div className="card" style={{ padding: '24px', margin: 0 }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>Hourly Sending Velocity</h3>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyData}>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Bar dataKey="emails" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Status */}
                    <div className="card" style={{ flex: 1, padding: '24px', margin: 0, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '16px' }}>Campaign Health</h3>
                        <div style={{ flex: 1, minHeight: '220px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={10}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                    <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Table */}
            <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>Performance Breakdown</h3>
                <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr>
                            <th style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Campaign</th>
                            <th style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Volume</th>
                            <th style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Health</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map(c => {
                            const total = (c.stats?.sent || 0) + (c.stats?.failed || 0);
                            const progress = total > 0 ? (c.stats.sent / total) * 100 : 0;
                            return (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: '700', color: 'var(--secondary-color)' }}>{c.name}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                                            background: c.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                                            color: c.status === 'Completed' ? '#15803d' : '#b45309'
                                        }}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{c.stats?.sent || 0}</td>
                                    <td>
                                        <div style={{ width: '100px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${progress}%`, height: '100%', background: '#10b981' }} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Analytics;
