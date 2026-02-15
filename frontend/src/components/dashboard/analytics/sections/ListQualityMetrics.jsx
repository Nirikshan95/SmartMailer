import PropTypes from 'prop-types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, CartesianGrid, XAxis, YAxis, Area } from 'recharts';
import { Users, Shield, Copy, Building2, AtSign } from 'lucide-react';
import ChartCard from '../shared/ChartCard';

const ListQualityMetrics = ({ data, isLoading }) => {
    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!data) {
        return null;
    }

    const { healthScore, totalContacts, duplicates, domainDistribution, lenientProviders, qualityTrend, topDomains } = data;

    return (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Users size={20} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>List Quality Metrics</h2>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* List Health Score */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Health Score</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', margin: 0 }}>{healthScore}</h3>
                        </div>
                        <Shield size={24} style={{ color: '#10b981' }} />
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${healthScore}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#10b981', marginTop: '8px', margin: 0 }}>↑ Excellent quality</p>
                </div>

                {/* Total Contacts */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Contacts</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-color)', margin: 0 }}>
                                {totalContacts.toLocaleString()}
                            </h3>
                        </div>
                        <Users size={24} style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Across all campaigns</p>
                </div>

                {/* Duplicates */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Duplicates</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b', margin: 0 }}>
                                {duplicates.count}
                            </h3>
                        </div>
                        <Copy size={24} style={{ color: '#f59e0b' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                        {duplicates.percentage}% of total
                    </p>
                </div>

                {/* Corporate Domains */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Corporate</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6', margin: 0 }}>
                                {domainDistribution[0].percentage}%
                            </h3>
                        </div>
                        <Building2 size={24} style={{ color: '#3b82f6' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                        {domainDistribution[0].count.toLocaleString()} domains
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', marginBottom: '20px' }}>
                {/* Domain Distribution */}
                <ChartCard title="Domain Distribution">
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={domainDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {domainDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                    formatter={(value, name, props) => [
                                        `${value.toLocaleString()} (${props.payload.percentage}%)`,
                                        props.payload.type
                                    ]}
                                />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Email Provider Breakdown */}
                <ChartCard title="Email Provider Breakdown">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {lenientProviders.map((provider, idx) => (
                            <div key={idx} style={{ 
                                padding: '14px', 
                                background: 'var(--surface-color)', 
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            borderRadius: '50%', 
                                            background: provider.color
                                        }} />
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary-color)' }}>
                                            {provider.provider}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary-color)' }}>
                                            {provider.count.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                            {provider.percentage}%
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${provider.deliveryRate}%`, 
                                            height: '100%', 
                                            background: provider.color
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#10b981' }}>
                                        {provider.deliveryRate}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Quality Trend */}
                <ChartCard title="Quality Trend (6 Months)">
                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={qualityTrend}>
                                <defs>
                                    <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis domain={[75, 95]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fill="url(#qualityGradient)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Top Domains */}
                <ChartCard title="Top Corporate Domains">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {topDomains.map((domain, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '12px',
                                background: 'var(--surface-color)',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                    <AtSign size={16} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--secondary-color)' }}>
                                        {domain.domain}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {domain.count}
                                    </span>
                                    <div style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '12px',
                                        background: domain.quality >= 93 ? '#dcfce7' : '#fef3c7',
                                        color: domain.quality >= 93 ? '#15803d' : '#b45309',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        {domain.quality}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

ListQualityMetrics.propTypes = {
    data: PropTypes.shape({
        healthScore: PropTypes.number.isRequired,
        totalContacts: PropTypes.number.isRequired,
        duplicates: PropTypes.shape({
            count: PropTypes.number.isRequired,
            percentage: PropTypes.number.isRequired
        }).isRequired,
        domainDistribution: PropTypes.arrayOf(PropTypes.shape({
            type: PropTypes.string.isRequired,
            count: PropTypes.number.isRequired,
            percentage: PropTypes.number.isRequired,
            color: PropTypes.string.isRequired
        })).isRequired,
        lenientProviders: PropTypes.arrayOf(PropTypes.shape({
            provider: PropTypes.string.isRequired,
            count: PropTypes.number.isRequired,
            percentage: PropTypes.number.isRequired,
            deliveryRate: PropTypes.number.isRequired,
            color: PropTypes.string.isRequired
        })).isRequired,
        qualityTrend: PropTypes.arrayOf(PropTypes.shape({
            month: PropTypes.string.isRequired,
            score: PropTypes.number.isRequired
        })).isRequired,
        topDomains: PropTypes.arrayOf(PropTypes.shape({
            domain: PropTypes.string.isRequired,
            count: PropTypes.number.isRequired,
            quality: PropTypes.number.isRequired
        })).isRequired
    }),
    isLoading: PropTypes.bool
};

export default ListQualityMetrics;
