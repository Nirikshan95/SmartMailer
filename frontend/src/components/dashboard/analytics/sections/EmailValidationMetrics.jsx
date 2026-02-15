import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Shield, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import SkeletonLoader from '../shared/SkeletonLoader';
import EmptyState from '../shared/EmptyState';

const EmailValidationMetrics = ({ data, isLoading = false }) => {
    if (isLoading) {
        return (
            <div>
                <SkeletonLoader type="card" count={3} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '24px' }}>
                    <SkeletonLoader type="chart" />
                    <SkeletonLoader type="chart" />
                </div>
            </div>
        );
    }

    if (!data) {
        return <EmptyState message="No validation metrics available" icon={Shield} />;
    }

    const { validationSuccessRate, invalidReasons, bounceRateByDomain, domainHealthTrend } = data;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Shield size={20} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary-color)', margin: 0 }}>
                    Email Validation Metrics
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                {/* Validation Success Rate */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Validation Success
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', margin: 0 }}>
                                {validationSuccessRate}%
                            </h3>
                        </div>
                        <CheckCircle size={24} style={{ color: '#10b981' }} />
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${validationSuccessRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                    </div>
                </div>

                {/* Total Invalid Emails */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Invalid Emails
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#ef4444', margin: 0 }}>
                                {invalidReasons.reduce((sum, r) => sum + r.count, 0)}
                            </h3>
                        </div>
                        <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        Across {invalidReasons.length} failure types
                    </p>
                </div>

                {/* Domain Health Score */}
                <div className="card" style={{ padding: '20px', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Domain Health
                            </p>
                            <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-color)', margin: 0 }}>
                                {domainHealthTrend[domainHealthTrend.length - 1].score}
                            </h3>
                        </div>
                        <Activity size={24} style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>↑ +3 from last week</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {/* Bounce Rate by Domain */}
                <div className="card" style={{ padding: '24px', margin: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                        Bounce Rate by Domain
                    </h3>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bounceRateByDomain} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis type="category" dataKey="domain" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                    formatter={(value, name) => [name === 'bounceRate' ? `${value}%` : value, name === 'bounceRate' ? 'Bounce Rate' : 'Total Emails']}
                                />
                                <Bar dataKey="bounceRate" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Invalid Email Reasons */}
                <div className="card" style={{ padding: '24px', margin: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                        Invalid Email Reasons
                    </h3>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={invalidReasons}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {invalidReasons.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    align="center" 
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

EmailValidationMetrics.propTypes = {
    data: PropTypes.shape({
        validationSuccessRate: PropTypes.number.isRequired,
        invalidReasons: PropTypes.arrayOf(PropTypes.shape({
            reason: PropTypes.string.isRequired,
            count: PropTypes.number.isRequired,
            color: PropTypes.string.isRequired
        })).isRequired,
        bounceRateByDomain: PropTypes.arrayOf(PropTypes.shape({
            domain: PropTypes.string.isRequired,
            bounceRate: PropTypes.number.isRequired,
            emails: PropTypes.number.isRequired
        })).isRequired,
        domainHealthTrend: PropTypes.arrayOf(PropTypes.shape({
            date: PropTypes.string.isRequired,
            score: PropTypes.number.isRequired
        })).isRequired
    }),
    isLoading: PropTypes.bool
};

export default EmailValidationMetrics;
