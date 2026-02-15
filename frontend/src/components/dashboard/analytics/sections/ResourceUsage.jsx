import PropTypes from 'prop-types';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Gauge, TrendingUp } from 'lucide-react';
import KPICard from '../shared/KPICard';
import ChartCard from '../shared/ChartCard';

const ResourceUsage = ({ data, isLoading }) => {
    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!data) {
        return null;
    }

    const { dailyLimit, hourlyLimit, sendingVelocity, peakUsageHeatmap, quotaUtilization } = data;

    return (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Gauge size={20} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>Resource Usage</h2>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Daily Limit Gauge */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Daily Limit</p>
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                padding: '4px 8px', 
                                borderRadius: '12px',
                                background: dailyLimit.percentage > 90 ? '#fee2e2' : '#fef3c7',
                                color: dailyLimit.percentage > 90 ? '#dc2626' : '#f59e0b'
                            }}>
                                {dailyLimit.percentage > 90 ? 'High Usage' : 'Normal'}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--secondary-color)', margin: 0 }}>
                            {dailyLimit.used} / {dailyLimit.total}
                        </h3>
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${dailyLimit.percentage}%`, 
                            height: '100%', 
                            background: dailyLimit.percentage > 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #059669)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', margin: 0 }}>
                        {dailyLimit.percentage}% utilized
                    </p>
                </div>

                {/* Hourly Limit Gauge */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Hourly Limit</p>
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                padding: '4px 8px', 
                                borderRadius: '12px',
                                background: '#dcfce7',
                                color: '#15803d'
                            }}>
                                Safe
                            </span>
                        </div>
                        <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--secondary-color)', margin: 0 }}>
                            {hourlyLimit.used} / {hourlyLimit.total}
                        </h3>
                    </div>
                    <div style={{ position: 'relative', width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${hourlyLimit.percentage}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #10b981, #059669)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', margin: 0 }}>
                        {hourlyLimit.percentage}% utilized
                    </p>
                </div>

                {/* Peak Usage Time */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Peak Usage</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-color)', margin: 0 }}>12pm</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>Thursday</p>
                        </div>
                        <TrendingUp size={24} style={{ color: 'var(--primary-color)' }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Sending Velocity Over Time */}
                <ChartCard title="Sending Velocity (24h)">
                    <div style={{ height: '260px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sendingVelocity}>
                                <defs>
                                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Emails/Hour', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Area type="monotone" dataKey="rate" stroke="var(--primary-color)" strokeWidth={3} fill="url(#velocityGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Quota Utilization */}
                <ChartCard title="Quota Utilization">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {quotaUtilization.map((quota, idx) => {
                            const percentage = (quota.used / quota.limit) * 100;
                            const isHigh = percentage > 80;
                            return (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--secondary-color)' }}>
                                            {quota.resource}
                                        </span>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: isHigh ? '#ef4444' : '#10b981' }}>
                                            {quota.used} / {quota.limit}
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${percentage}%`, 
                                            height: '100%', 
                                            background: isHigh ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #059669)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                                        {percentage.toFixed(1)}% used
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </ChartCard>
            </div>

            {/* Peak Usage Heatmap */}
            <ChartCard title="Peak Usage Hours (Heatmap)">
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(6, 1fr)', gap: '8px', minWidth: '600px' }}>
                        {/* Header */}
                        <div></div>
                        {['6am', '9am', '12pm', '3pm', '6pm', '9pm'].map(time => (
                            <div key={time} style={{ 
                                fontSize: '11px', 
                                color: 'var(--text-secondary)', 
                                textAlign: 'center',
                                padding: '8px'
                            }}>
                                {time}
                            </div>
                        ))}
                        
                        {/* Heatmap Cells */}
                        {peakUsageHeatmap.map(dayData => (
                            <>
                                <div key={dayData.day} style={{ 
                                    fontSize: '12px', 
                                    fontWeight: '600', 
                                    color: 'var(--secondary-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px'
                                }}>
                                    {dayData.day}
                                </div>
                                {['6am', '9am', '12pm', '3pm', '6pm', '9pm'].map(time => {
                                    const value = dayData[time];
                                    const intensity = value / 100;
                                    return (
                                        <div key={`${dayData.day}-${time}`} style={{
                                            background: `rgba(59, 130, 246, ${intensity})`,
                                            borderRadius: '6px',
                                            padding: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: intensity > 0.5 ? '#fff' : 'var(--secondary-color)',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {value}
                                        </div>
                                    );
                                })}
                            </>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Low</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
                            <div key={intensity} style={{
                                width: '24px',
                                height: '12px',
                                background: `rgba(59, 130, 246, ${intensity})`,
                                borderRadius: '2px'
                            }} />
                        ))}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>High</span>
                </div>
            </ChartCard>
        </div>
    );
};

ResourceUsage.propTypes = {
    data: PropTypes.shape({
        dailyLimit: PropTypes.shape({
            used: PropTypes.number.isRequired,
            total: PropTypes.number.isRequired,
            percentage: PropTypes.number.isRequired
        }).isRequired,
        hourlyLimit: PropTypes.shape({
            used: PropTypes.number.isRequired,
            total: PropTypes.number.isRequired,
            percentage: PropTypes.number.isRequired
        }).isRequired,
        sendingVelocity: PropTypes.arrayOf(PropTypes.shape({
            time: PropTypes.string.isRequired,
            rate: PropTypes.number.isRequired
        })).isRequired,
        peakUsageHeatmap: PropTypes.arrayOf(PropTypes.object).isRequired,
        quotaUtilization: PropTypes.arrayOf(PropTypes.shape({
            resource: PropTypes.string.isRequired,
            used: PropTypes.number.isRequired,
            limit: PropTypes.number.isRequired
        })).isRequired
    }),
    isLoading: PropTypes.bool
};

export default ResourceUsage;
