import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Mail, CheckCircle, Activity, Shield, TrendingUp, AlertTriangle, Zap, Target, Users, Brain, ArrowRight } from 'lucide-react';
import KPICard from '../shared/KPICard';
import ChartCard from '../shared/ChartCard';
import InsightCard from '../shared/InsightCard';
import SkeletonLoader from '../shared/SkeletonLoader';

const OverviewTab = ({
    emailStats,
    campaigns,
    validationData,
    deliveryData,
    campaignData,
    resourceData,
    qualityData,
    predictiveData,
    mockOverview,
    isLoading = false,
    onNavigateToTab
}) => {
    // Aggregate KPI data
    const kpiData = useMemo(() => {
        // Use real data if available and has non-zero total volume, otherwise fallback to mock
        const hasHistory = emailStats?.history?.length > 0;
        const totalRealVolume = hasHistory ? emailStats.history.reduce((sum, item) => sum + (item.count || 0), 0) : 0;

        const effectiveEmailStats = totalRealVolume > 0 ? emailStats : (mockOverview?.emailStats || { history: [] });
        const effectiveCampaigns = campaigns?.length > 0 ? campaigns : (mockOverview?.campaigns || []);

        const campaignStats = effectiveCampaigns.reduce((acc, camp) => {
            const stats = camp.stats || { sent: 0, failed: 0, pending: 0 };
            acc.sent += stats.sent || 0;
            acc.failed += stats.failed || 0;
            acc.pending += stats.pending || 0;
            return acc;
        }, { sent: 0, failed: 0, pending: 0 });

        const totalVolume = effectiveEmailStats.history?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
        const successRate = campaignStats.sent + campaignStats.failed > 0
            ? Math.round((campaignStats.sent / (campaignStats.sent + campaignStats.failed)) * 100)
            : 0;
        const activeCampaigns = effectiveCampaigns.filter(c => c.status !== 'Completed').length;
        const healthScore = qualityData?.healthScore || (totalRealVolume > 0 ? 0 : 87.5); // Fallback health score

        return {
            totalVolume,
            successRate,
            activeCampaigns,
            healthScore
        };
    }, [emailStats, campaigns, qualityData, mockOverview]);

    // Format chart data
    const chartData = useMemo(() => {
        const hasHistory = emailStats?.history?.length > 0;
        const totalRealVolume = hasHistory ? emailStats.history.reduce((sum, item) => sum + (item.count || 0), 0) : 0;

        const history = totalRealVolume > 0 ? emailStats.history : (mockOverview?.emailStats?.history || []);

        return history
            .slice(-7) // Last 7 days
            .map(item => ({
                name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                emails: item.count
            }));
    }, [emailStats, mockOverview]);

    // Campaign health pie data
    const pieData = useMemo(() => {
        const effectiveCampaigns = campaigns?.length > 0 ? campaigns : (mockOverview?.campaigns || []);

        const campaignStats = effectiveCampaigns.reduce((acc, camp) => {
            const stats = camp.stats || { sent: 0, failed: 0, pending: 0 };
            acc.sent += stats.sent || 0;
            acc.failed += stats.failed || 0;
            acc.pending += stats.pending || 0;
            return acc;
        }, { sent: 0, failed: 0, pending: 0 });

        const data = [
            { name: 'Sent', value: campaignStats.sent, color: '#10b981' },
            { name: 'Pending', value: campaignStats.pending, color: '#f59e0b' },
            { name: 'Failed', value: campaignStats.failed, color: '#ef4444' }
        ].filter(d => d.value > 0);

        // If no data, show a dummy placeholder or fallback to mock campaigns
        if (data.length === 0 && campaigns?.length > 0 && mockOverview?.campaigns) {
            const mockCampaignStats = mockOverview.campaigns.reduce((acc, camp) => {
                const stats = camp.stats || { sent: 0, failed: 0, pending: 0 };
                acc.sent += stats.sent || 0;
                acc.failed += stats.failed || 0;
                acc.pending += stats.pending || 0;
                return acc;
            }, { sent: 0, failed: 0, pending: 0 });

            return [
                { name: 'Sent', value: mockCampaignStats.sent, color: '#10b981' },
                { name: 'Pending', value: mockCampaignStats.pending, color: '#f59e0b' },
                { name: 'Failed', value: mockCampaignStats.failed, color: '#ef4444' }
            ];
        }

        return data;
    }, [campaigns, mockOverview]);

    // Engagement trends (mock data for now)
    const engagementTrends = [
        { day: 'Mon', rate: 42 },
        { day: 'Tue', rate: 55 },
        { day: 'Wed', rate: 48 },
        { day: 'Thu', rate: 72 },
        { day: 'Fri', rate: 68 },
        { day: 'Sat', rate: 50 },
        { day: 'Sun', rate: 62 }
    ];

    // Quick insights from each category
    const quickInsights = useMemo(() => {
        const insights = [];

        // Validation insight
        if (validationData?.validationSuccessRate) {
            insights.push({
                icon: Shield,
                title: 'Validation Success',
                value: `${validationData.validationSuccessRate}%`,
                trend: validationData.validationSuccessRate > 90 ? 'up' : 'down',
                color: '#10b981',
                link: 'validation-delivery'
            });
        }

        // Delivery insight
        if (deliveryData?.avgResponseTime) {
            insights.push({
                icon: Zap,
                title: 'Avg Response Time',
                value: `${deliveryData.avgResponseTime}s`,
                trend: deliveryData.avgResponseTime < 2 ? 'up' : 'down',
                color: '#3b82f6',
                link: 'validation-delivery'
            });
        }

        // Campaign insight
        if (campaignData?.bestPerforming?.[0]) {
            insights.push({
                icon: Target,
                title: 'Top Campaign',
                value: campaignData.bestPerforming[0].campaign,
                subtitle: `${campaignData.bestPerforming[0].score}% success`,
                color: '#8b5cf6',
                link: 'campaign-intelligence'
            });
        }

        // Resource insight
        if (resourceData?.dailyLimit) {
            const isHigh = resourceData.dailyLimit.percentage > 80;
            insights.push({
                icon: isHigh ? AlertTriangle : Activity,
                title: 'Daily Limit',
                value: `${resourceData.dailyLimit.percentage}%`,
                trend: isHigh ? 'down' : 'neutral',
                color: isHigh ? '#f59e0b' : '#10b981',
                link: 'resources-quality'
            });
        }

        // Quality insight
        if (qualityData?.healthScore) {
            insights.push({
                icon: Users,
                title: 'List Health',
                value: `${qualityData.healthScore}`,
                trend: qualityData.healthScore > 85 ? 'up' : 'neutral',
                color: '#10b981',
                link: 'resources-quality'
            });
        }

        // Predictive insight
        if (predictiveData?.successProbability?.overall) {
            insights.push({
                icon: Brain,
                title: 'Success Probability',
                value: `${predictiveData.successProbability.overall}%`,
                subtitle: 'AI Prediction',
                color: '#8b5cf6',
                link: 'predictive-live'
            });
        }

        return insights;
    }, [validationData, deliveryData, campaignData, resourceData, qualityData, predictiveData]);

    if (isLoading) {
        return (
            <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
                <SkeletonLoader count={4} height={300} />
            </div>
        );
    }

    return (
        <div
            role="tabpanel"
            id="overview-panel"
            aria-labelledby="overview-tab"
            style={{ paddingTop: '8px' }}
        >
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <KPICard
                    icon={Mail}
                    label="Total Volume"
                    value={kpiData?.totalVolume?.toLocaleString() || '0'}
                    iconColor="var(--primary-color)"
                />
                <KPICard
                    icon={CheckCircle}
                    label="Success Rate"
                    value={`${kpiData?.successRate || 0}%`}
                    iconColor="#10b981"
                    trend={kpiData?.successRate > 90 ? 'up' : 'neutral'}
                />
                <KPICard
                    icon={Activity}
                    label="Active Campaigns"
                    value={kpiData?.activeCampaigns || 0}
                    iconColor="#f59e0b"
                />
                <KPICard
                    icon={Shield}
                    label="Health Score"
                    value={kpiData?.healthScore || 0}
                    iconColor="#10b981"
                    trend={kpiData?.healthScore > 85 ? 'up' : 'neutral'}
                />
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '24px', marginBottom: '32px' }}>
                {/* Sending Volume History */}
                <ChartCard
                    title="Sending Volume History"
                    icon={TrendingUp}
                    action={
                        <button
                            onClick={() => onNavigateToTab('validation-delivery')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--primary-color)',
                                background: 'transparent',
                                border: '1px solid var(--primary-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            View Details <ArrowRight size={14} />
                        </button>
                    }
                >
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Area type="monotone" dataKey="emails" stroke="var(--primary-color)" strokeWidth={3} fill="url(#colorTrend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Campaign Health */}
                <ChartCard
                    title="Campaign Health"
                    action={
                        <button
                            onClick={() => onNavigateToTab('campaign-intelligence')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--primary-color)',
                                background: 'transparent',
                                border: '1px solid var(--primary-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            View Details <ArrowRight size={14} />
                        </button>
                    }
                >
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={10}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Engagement Outlook */}
            <div style={{ marginBottom: '32px' }}>
                <ChartCard title="Engagement Outlook" icon={TrendingUp}>
                    <div style={{ height: '220px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={engagementTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                <Line type="monotone" dataKey="rate" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Quick Insights */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary-color)', marginBottom: '20px' }}>
                    Quick Insights
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {quickInsights.map((insight, idx) => (
                        <InsightCard
                            key={idx}
                            icon={insight.icon}
                            title={insight.title}
                            value={insight.value}
                            subtitle={insight.subtitle}
                            trend={insight.trend}
                            color={insight.color}
                            onClick={() => onNavigateToTab(insight.link)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

OverviewTab.propTypes = {
    emailStats: PropTypes.object,
    campaigns: PropTypes.array,
    validationData: PropTypes.object,
    deliveryData: PropTypes.object,
    campaignData: PropTypes.object,
    resourceData: PropTypes.object,
    qualityData: PropTypes.object,
    predictiveData: PropTypes.object,
    mockOverview: PropTypes.object,
    isLoading: PropTypes.bool,
    onNavigateToTab: PropTypes.func.isRequired
};

export default OverviewTab;
