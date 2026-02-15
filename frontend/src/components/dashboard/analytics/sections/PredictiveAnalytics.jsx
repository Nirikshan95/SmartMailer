import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ComposedChart, Area, Line } from 'recharts';
import { Brain, Sparkles, Clock, DollarSign } from 'lucide-react';
import ChartCard from '../shared/ChartCard';

const PredictiveAnalytics = ({ data, isLoading }) => {
    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!data) {
        return null;
    }

    const { activeCampaigns, optimalSendTimes, budgetForecast, successProbability, mlInsights } = data;

    return (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Brain size={20} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>Predictive Analytics</h2>
                <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '700', 
                    padding: '4px 8px', 
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    marginLeft: '8px'
                }}>
                    AI-POWERED
                </span>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Overall Success Probability */}
                <div className="card" style={{ padding: '20px', margin: 0, background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Success Probability</p>
                            <h3 style={{ fontSize: '36px', fontWeight: '800', color: '#8b5cf6', margin: 0 }}>
                                {successProbability.overall}%
                            </h3>
                        </div>
                        <Sparkles size={24} style={{ color: '#8b5cf6' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#8b5cf6', margin: 0 }}>ML-based prediction</p>
                </div>

                {/* Estimated Completion */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Avg Completion</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-color)', margin: 0 }}>
                                {(activeCampaigns.reduce((sum, c) => sum + c.estimatedTime, 0) / activeCampaigns.length).toFixed(1)}h
                            </h3>
                        </div>
                        <Clock size={24} style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>For active campaigns</p>
                </div>

                {/* Budget Forecast */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Next Month</p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', margin: 0 }}>
                                ${budgetForecast[0].estimated}
                            </h3>
                        </div>
                        <DollarSign size={24} style={{ color: '#10b981' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                        {budgetForecast[0].confidence}% confidence
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Optimal Send Times */}
                <ChartCard title="Optimal Send Times (Recommended)">
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={optimalSendTimes}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar 
                                    dataKey="successRate" 
                                    radius={[4, 4, 0, 0]} 
                                    fill="#8b5cf6"
                                >
                                    {optimalSendTimes.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.recommended ? '#8b5cf6' : '#cbd5e1'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#8b5cf6' }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Recommended</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#cbd5e1' }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Not Optimal</span>
                        </div>
                    </div>
                </ChartCard>

                {/* ML Insights */}
                <ChartCard title="AI Insights">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {mlInsights.map((insight, idx) => (
                            <div key={idx} style={{ 
                                padding: '16px', 
                                background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)',
                                borderRadius: '8px',
                                border: '1px solid #8b5cf620'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                        {insight.insight}
                                    </span>
                                    <span style={{ 
                                        fontSize: '10px', 
                                        fontWeight: '700', 
                                        padding: '3px 8px', 
                                        borderRadius: '10px',
                                        background: '#8b5cf620',
                                        color: '#8b5cf6'
                                    }}>
                                        {insight.confidence}%
                                    </span>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--secondary-color)' }}>
                                    {insight.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Campaign Completion Estimates */}
                <ChartCard title="Campaign Completion Estimates">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {activeCampaigns.map((campaign, idx) => (
                            <div key={idx} style={{ 
                                padding: '16px', 
                                background: 'var(--surface-color)', 
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary-color)' }}>
                                        {campaign.name}
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)' }}>
                                        ~{campaign.estimatedTime}h
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    <span>{campaign.remaining} emails remaining</span>
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>{campaign.probability}% success</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ 
                                        width: `${campaign.probability}%`, 
                                        height: '100%', 
                                        background: 'linear-gradient(90deg, #8b5cf6, #667eea)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Budget Forecast */}
                <ChartCard title="Budget Forecast (5 Months)">
                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={budgetForecast}>
                                <defs>
                                    <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Area type="monotone" dataKey="estimated" stroke="#10b981" strokeWidth={2} fill="url(#budgetGradient)" />
                                <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

PredictiveAnalytics.propTypes = {
    data: PropTypes.shape({
        activeCampaigns: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            remaining: PropTypes.number.isRequired,
            estimatedTime: PropTypes.number.isRequired,
            probability: PropTypes.number.isRequired
        })).isRequired,
        optimalSendTimes: PropTypes.arrayOf(PropTypes.shape({
            hour: PropTypes.string.isRequired,
            successRate: PropTypes.number.isRequired,
            volume: PropTypes.number.isRequired,
            recommended: PropTypes.bool.isRequired
        })).isRequired,
        budgetForecast: PropTypes.arrayOf(PropTypes.shape({
            month: PropTypes.string.isRequired,
            estimated: PropTypes.number.isRequired,
            actual: PropTypes.number.isRequired,
            confidence: PropTypes.number.isRequired
        })).isRequired,
        successProbability: PropTypes.shape({
            overall: PropTypes.number.isRequired,
            byDomain: PropTypes.arrayOf(PropTypes.shape({
                domain: PropTypes.string.isRequired,
                probability: PropTypes.number.isRequired
            })).isRequired
        }).isRequired,
        mlInsights: PropTypes.arrayOf(PropTypes.shape({
            insight: PropTypes.string.isRequired,
            value: PropTypes.string.isRequired,
            confidence: PropTypes.number.isRequired
        })).isRequired
    }),
    isLoading: PropTypes.bool
};

export default PredictiveAnalytics;
