import PropTypes from 'prop-types';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Radio, Wifi, AlertTriangle, Bell, CheckCircle, Activity } from 'lucide-react';
import ChartCard from '../shared/ChartCard';

const RealtimeMonitoring = ({ data, isLoading }) => {
    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!data) {
        return null;
    }

    const { systemHealth, liveActivity, recentAlerts, rateLimitStatus, liveMetrics } = data;

    return (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Radio size={20} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>Real-time Monitoring</h2>
                <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '700', 
                    padding: '4px 8px', 
                    borderRadius: '12px',
                    background: '#dcfce7',
                    color: '#15803d',
                    marginLeft: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#15803d', animation: 'pulse 2s infinite' }} />
                    LIVE
                </span>
            </div>

            {/* System Health Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {Object.entries(systemHealth).map(([service, serviceData]) => (
                    <div key={service} className="card" style={{ padding: '16px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Wifi size={16} style={{ color: serviceData.status === 'healthy' ? '#10b981' : '#f59e0b' }} />
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--secondary-color)', textTransform: 'uppercase' }}>
                                    {service}
                                </span>
                            </div>
                            <span style={{ 
                                fontSize: '10px', 
                                fontWeight: '700', 
                                padding: '3px 8px', 
                                borderRadius: '10px',
                                background: serviceData.status === 'healthy' ? '#dcfce7' : '#fef3c7',
                                color: serviceData.status === 'healthy' ? '#15803d' : '#b45309'
                            }}>
                                {serviceData.status}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span>Uptime: {serviceData.uptime}%</span>
                            <span>{serviceData.latency}ms</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rate Limit Warnings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ 
                    padding: '20px', 
                    margin: 0,
                    background: rateLimitStatus.hourly.percentage > 80 ? '#fef3c715' : 'var(--card-bg)',
                    border: rateLimitStatus.hourly.percentage > 80 ? '1px solid #f59e0b40' : '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Hourly Rate Limit
                            </p>
                            <h3 style={{ fontSize: '28px', fontWeight: '800', color: rateLimitStatus.hourly.percentage > 80 ? '#f59e0b' : 'var(--secondary-color)', margin: 0 }}>
                                {rateLimitStatus.hourly.current} / {rateLimitStatus.hourly.limit}
                            </h3>
                        </div>
                        <AlertTriangle size={24} style={{ color: rateLimitStatus.hourly.percentage > 80 ? '#f59e0b' : '#94a3b8' }} />
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ 
                            width: `${rateLimitStatus.hourly.percentage}%`, 
                            height: '100%', 
                            background: rateLimitStatus.hourly.percentage > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #059669)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <p style={{ fontSize: '11px', color: rateLimitStatus.hourly.percentage > 80 ? '#f59e0b' : 'var(--text-secondary)', margin: 0 }}>
                        {rateLimitStatus.hourly.percentage}% utilized • {rateLimitStatus.hourly.trend}
                    </p>
                </div>

                <div className="card" style={{ 
                    padding: '20px', 
                    margin: 0,
                    background: rateLimitStatus.daily.percentage > 90 ? '#fee2e215' : 'var(--card-bg)',
                    border: rateLimitStatus.daily.percentage > 90 ? '1px solid #ef444440' : '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Daily Rate Limit
                            </p>
                            <h3 style={{ fontSize: '28px', fontWeight: '800', color: rateLimitStatus.daily.percentage > 90 ? '#ef4444' : 'var(--secondary-color)', margin: 0 }}>
                                {rateLimitStatus.daily.current} / {rateLimitStatus.daily.limit}
                            </h3>
                        </div>
                        <AlertTriangle size={24} style={{ color: rateLimitStatus.daily.percentage > 90 ? '#ef4444' : '#94a3b8' }} />
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ 
                            width: `${rateLimitStatus.daily.percentage}%`, 
                            height: '100%', 
                            background: rateLimitStatus.daily.percentage > 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #059669)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <p style={{ fontSize: '11px', color: rateLimitStatus.daily.percentage > 90 ? '#ef4444' : 'var(--text-secondary)', margin: 0 }}>
                        {rateLimitStatus.daily.percentage}% utilized • {rateLimitStatus.daily.trend}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Live Metrics Chart */}
                <ChartCard title="Live Activity (Last 10 min)">
                    <div style={{ height: '260px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={liveMetrics}>
                                <defs>
                                    <linearGradient id="liveGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Area type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={3} fill="url(#liveGradient)" name="Sent" />
                                <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="transparent" name="Failed" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Recent Alerts */}
                <div className="card" style={{ padding: '24px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>Recent Alerts</h3>
                        <Bell size={16} style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentAlerts.map((alert, idx) => (
                            <div key={idx} style={{ 
                                padding: '14px', 
                                background: alert.type === 'warning' ? '#fef3c710' : alert.type === 'success' ? '#dcfce710' : '#f1f5f9',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${alert.type === 'warning' ? '#f59e0b' : alert.type === 'success' ? '#10b981' : '#3b82f6'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    {alert.type === 'warning' && <AlertTriangle size={16} style={{ color: '#f59e0b', marginTop: '2px' }} />}
                                    {alert.type === 'success' && <CheckCircle size={16} style={{ color: '#10b981', marginTop: '2px' }} />}
                                    {alert.type === 'info' && <Activity size={16} style={{ color: '#3b82f6', marginTop: '2px' }} />}
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--secondary-color)', margin: 0, marginBottom: '4px' }}>
                                            {alert.message}
                                        </p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                                            {alert.time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Live Campaign Activity */}
            <ChartCard title="Live Campaign Activity">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '8px' }}>Time</th>
                                <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '8px' }}>Campaign</th>
                                <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '8px' }}>Emails Sent</th>
                                <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '8px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveActivity.map((activity, idx) => (
                                <tr key={idx} style={{ background: 'var(--surface-color)' }}>
                                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', borderRadius: '8px 0 0 8px' }}>
                                        {activity.time}
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--secondary-color)' }}>
                                        {activity.campaign}
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--secondary-color)' }}>
                                        {activity.sent}
                                    </td>
                                    <td style={{ padding: '12px', borderRadius: '0 8px 8px 0' }}>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            borderRadius: '12px', 
                                            fontSize: '11px', 
                                            fontWeight: '700',
                                            background: activity.status === 'success' ? '#dcfce7' : '#fef3c7',
                                            color: activity.status === 'success' ? '#15803d' : '#b45309'
                                        }}>
                                            {activity.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ChartCard>
        </div>
    );
};

RealtimeMonitoring.propTypes = {
    data: PropTypes.shape({
        systemHealth: PropTypes.objectOf(PropTypes.shape({
            status: PropTypes.string.isRequired,
            uptime: PropTypes.number.isRequired,
            latency: PropTypes.number.isRequired
        })).isRequired,
        liveActivity: PropTypes.arrayOf(PropTypes.shape({
            time: PropTypes.string.isRequired,
            campaign: PropTypes.string.isRequired,
            sent: PropTypes.number.isRequired,
            status: PropTypes.string.isRequired
        })).isRequired,
        recentAlerts: PropTypes.arrayOf(PropTypes.shape({
            type: PropTypes.string.isRequired,
            message: PropTypes.string.isRequired,
            time: PropTypes.string.isRequired,
            severity: PropTypes.string.isRequired
        })).isRequired,
        rateLimitStatus: PropTypes.shape({
            hourly: PropTypes.shape({
                current: PropTypes.number.isRequired,
                limit: PropTypes.number.isRequired,
                percentage: PropTypes.number.isRequired,
                trend: PropTypes.string.isRequired
            }).isRequired,
            daily: PropTypes.shape({
                current: PropTypes.number.isRequired,
                limit: PropTypes.number.isRequired,
                percentage: PropTypes.number.isRequired,
                trend: PropTypes.string.isRequired
            }).isRequired
        }).isRequired,
        liveMetrics: PropTypes.arrayOf(PropTypes.shape({
            time: PropTypes.string.isRequired,
            sent: PropTypes.number.isRequired,
            failed: PropTypes.number.isRequired
        })).isRequired
    }),
    isLoading: PropTypes.bool
};

export default RealtimeMonitoring;
