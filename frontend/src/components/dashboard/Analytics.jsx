import React from 'react';
import { useDashboard } from './DashboardContext';
import { BarChart2, PieChart, Activity } from 'lucide-react';

const Analytics = () => {
    const { emailStats, completedEmails } = useDashboard();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Analytics</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={20} /> Sending Limits
                    </h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Daily Limit</span>
                                <span style={{ fontWeight: '600' }}>{emailStats.emailsToday} / {emailStats.maxPerDay}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.min(100, (emailStats.emailsToday / emailStats.maxPerDay) * 100)}%`,
                                    height: '100%',
                                    backgroundColor: 'var(--primary-color)'
                                }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Hourly Limit</span>
                                <span style={{ fontWeight: '600' }}>{emailStats.emailsThisHour} / {emailStats.maxPerHour}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.min(100, (emailStats.emailsThisHour / emailStats.maxPerHour) * 100)}%`,
                                    height: '100%',
                                    backgroundColor: 'var(--success-color)'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={20} /> Performance
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', color: 'var(--text-secondary)' }}>
                        Chart placeholder (Requires Chart.js or Recharts)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
