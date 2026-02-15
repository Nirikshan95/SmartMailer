import PropTypes from 'prop-types';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Zap, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import SkeletonLoader from '../shared/SkeletonLoader';
import EmptyState from '../shared/EmptyState';

const DeliveryPerformance = ({ data, isLoading = false }) => {
    if (isLoading) {
        return (
            <div>
                <SkeletonLoader type="card" count={4} />
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginTop: '24px' }}>
                    <SkeletonLoader type="chart" />
                    <SkeletonLoader type="chart" />
                </div>
            </div>
        );
    }

    if (!data) {
        return <EmptyState message="No delivery performance data available" icon={Zap} />;
    }

    const { deliveryRateTrend, failureCategories, peakSendingTimes, avgResponseTime, fastestTime, slowestTime } = data;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Zap size={20} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>
                    Delivery Performance
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Average Response Time */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Avg Response
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-color)', margin: 0 }}>
                                {avgResponseTime}s
                            </h3>
                        </div>
                        <Clock size={24} style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                        Range: {fastestTime}s - {slowestTime}s
                    </p>
                </div>

                {/* Current Delivery Rate */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Delivery Rate
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', margin: 0 }}>
                                {deliveryRateTrend[deliveryRateTrend.length - 1].rate}%
                            </h3>
                        </div>
                        <CheckCircle size={24} style={{ color: '#10b981' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#10b981', margin: 0 }}>↑ Trending up</p>
                </div>

                {/* Total Failed Emails */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Failed Emails
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444', margin: 0 }}>
                                {failureCategories.reduce((sum, f) => sum + f.count, 0)}
                            </h3>
                        </div>
                        <XCircle size={24} style={{ color: '#ef4444' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Last 7 days</p>
                </div>

                {/* Best Send Time */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Peak Time
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b', margin: 0 }}>2pm</h3>
                        </div>
                        <TrendingUp size={24} style={{ color: '#f59e0b' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Highest success rate</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Delivery Rate Trend */}
                <div className="card" style={{ padding: '24px', margin: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                        Delivery Rate Trend
                    </h3>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={deliveryRateTrend}>
                                <defs>
                                    <linearGradient id="deliveryGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Area yAxisId="left" type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} fill="url(#deliveryGradient)" />
                                <Line yAxisId="right" type="monotone" dataKey="rate" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Failed Email Analysis */}
                <div className="card" style={{ padding: '24px', margin: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                        Failure Categories
                    </h3>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={failureCategories}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="count"
                                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                >
                                    {failureCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Peak Sending Times */}
            <div className="card" style={{ padding: '24px', margin: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                    Peak Sending Times Analysis
                </h3>
                <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={peakSendingTimes}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                cursor={{ fill: '#f1f5f9' }}
                            />
                            <Legend />
                            <Bar dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} name="Successful" />
                            <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

DeliveryPerformance.propTypes = {
    data: PropTypes.shape({
        deliveryRateTrend: PropTypes.array.isRequired,
        failureCategories: PropTypes.array.isRequired,
        peakSendingTimes: PropTypes.array.isRequired,
        avgResponseTime: PropTypes.number.isRequired,
        fastestTime: PropTypes.number.isRequired,
        slowestTime: PropTypes.number.isRequired
    }),
    isLoading: PropTypes.bool
};

export default DeliveryPerformance;
