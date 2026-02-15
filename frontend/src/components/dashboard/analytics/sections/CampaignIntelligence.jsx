import PropTypes from 'prop-types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Target, Award, Clock, RefreshCw } from 'lucide-react';
import SkeletonLoader from '../shared/SkeletonLoader';
import EmptyState from '../shared/EmptyState';

const CampaignIntelligence = ({ data, isLoading = false }) => {
    if (isLoading) {
        return (
            <div>
                <SkeletonLoader type="card" count={3} />
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '24px' }}>
                    <SkeletonLoader type="chart" />
                    <SkeletonLoader type="chart" />
                </div>
            </div>
        );
    }

    if (!data) {
        return <EmptyState message="No campaign intelligence data available" icon={Target} />;
    }

    const { bestPerforming, durationMetrics, retryAnalysis } = data;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Target size={20} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>
                    Campaign Intelligence
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Best Campaign */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Top Campaign
                            </p>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-color)', margin: 0, marginBottom: '4px' }}>
                                {bestPerforming[0].campaign}
                            </h3>
                            <p style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', margin: 0 }}>
                                {bestPerforming[0].score}%
                            </p>
                        </div>
                        <Award size={24} style={{ color: '#f59e0b' }} />
                    </div>
                </div>

                {/* Avg Campaign Duration */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Avg Duration
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-color)', margin: 0 }}>
                                {durationMetrics.average}h
                            </h3>
                        </div>
                        <Clock size={24} style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                        Range: {durationMetrics.fastest}h - {durationMetrics.slowest}h
                    </p>
                </div>

                {/* Total Retries */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Retry Success
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', margin: 0 }}>
                                {Math.round((144 / (144 + 94)) * 100)}%
                            </h3>
                        </div>
                        <RefreshCw size={24} style={{ color: '#10b981' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>144 successful retries</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Campaign Comparison Radar */}
                <div className="card" style={{ padding: '24px', margin: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                        Campaign Comparison
                    </h3>
                    <div style={{ height: '320px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={[
                                { metric: 'Success Rate', 'Q1 Outreach': 96.5, 'Product Launch': 94.8, 'Follow-up': 98.2, 'Newsletter': 92.3 },
                                { metric: 'Speed', 'Q1 Outreach': 70, 'Product Launch': 78, 'Follow-up': 95, 'Newsletter': 55 },
                                { metric: 'Reliability', 'Q1 Outreach': 92, 'Product Launch': 88, 'Follow-up': 96, 'Newsletter': 85 },
                                { metric: 'Volume', 'Q1 Outreach': 60, 'Product Launch': 42, 'Follow-up': 30, 'Newsletter': 100 },
                                { metric: 'Retry Rate', 'Q1 Outreach': 92, 'Product Launch': 88, 'Follow-up': 96, 'Newsletter': 85 }
                            ]}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Radar name="Q1 Outreach" dataKey="Q1 Outreach" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                <Radar name="Product Launch" dataKey="Product Launch" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                <Radar name="Follow-up" dataKey="Follow-up" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Best Performing Campaigns */}
                <div className="card" style={{ padding: '24px', margin: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                        Best Performing
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {bestPerforming.map((camp, idx) => (
                            <div key={idx} style={{ 
                                padding: '16px', 
                                background: 'var(--surface-color)', 
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ 
                                            width: '24px', 
                                            height: '24px', 
                                            borderRadius: '50%', 
                                            background: idx === 0 ? '#fef3c7' : 'var(--card-bg)',
                                            color: idx === 0 ? '#f59e0b' : 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: '700'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary-color)' }}>
                                            {camp.campaign}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>
                                        {camp.score}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    <span>{camp.sent} sent</span>
                                    <span>{camp.failed} failed</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Retry Analysis */}
            <div className="card" style={{ padding: '24px', margin: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                    Retry Analysis
                </h3>
                <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={retryAnalysis}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="attempts" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                cursor={{ fill: '#f1f5f9' }}
                            />
                            <Legend />
                            <Bar dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} name="Successful" stackId="a" />
                            <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

CampaignIntelligence.propTypes = {
    data: PropTypes.shape({
        bestPerforming: PropTypes.array.isRequired,
        durationMetrics: PropTypes.shape({
            fastest: PropTypes.number.isRequired,
            slowest: PropTypes.number.isRequired,
            average: PropTypes.number.isRequired
        }).isRequired,
        retryAnalysis: PropTypes.array.isRequired
    }),
    isLoading: PropTypes.bool
};

export default CampaignIntelligence;
