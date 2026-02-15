import { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { useDashboard } from './DashboardContext';
import AnalyticsHeader from './analytics/AnalyticsHeader';
import AnalyticsTabs from './analytics/AnalyticsTabs';
import SkeletonLoader from './analytics/shared/SkeletonLoader';

// Lazy load tab components
const OverviewTab = lazy(() => import('./analytics/tabs/OverviewTab'));
const ValidationDeliveryTab = lazy(() => import('./analytics/tabs/ValidationDeliveryTab'));
const CampaignIntelligenceTab = lazy(() => import('./analytics/tabs/CampaignIntelligenceTab'));
const ResourcesQualityTab = lazy(() => import('./analytics/tabs/ResourcesQualityTab'));
const PredictiveLiveTab = lazy(() => import('./analytics/tabs/PredictiveLiveTab'));

const Analytics = () => {
    const { emailStats, campaigns } = useDashboard();

    // State management
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('7d');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [tabsLoaded, setTabsLoaded] = useState(new Set(['overview']));

    // Mock data for all analytics sections
    const analyticsData = useMemo(() => ({
        // Email Validation Metrics
        validation: {
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
        },

        // Delivery Performance
        delivery: {
            deliveryRateTrend: [
                { date: 'Jan 1', delivered: 245, failed: 12, rate: 95.3 },
                { date: 'Jan 2', delivered: 289, failed: 8, rate: 97.3 },
                { date: 'Jan 3', delivered: 312, failed: 15, rate: 95.4 },
                { date: 'Jan 4', delivered: 278, failed: 9, rate: 96.9 },
                { date: 'Jan 5', delivered: 334, failed: 11, rate: 96.8 },
                { date: 'Jan 6', delivered: 298, failed: 7, rate: 97.7 },
                { date: 'Jan 7', delivered: 356, failed: 13, rate: 96.5 }
            ],
            failureCategories: [
                { category: 'Daily Limit', count: 28, color: '#f59e0b' },
                { category: 'SMTP Error', count: 22, color: '#ef4444' },
                { category: 'Hourly Limit', count: 18, color: '#f97316' },
                { category: 'Timeout', count: 12, color: '#dc2626' },
                { category: 'Blocked', count: 8, color: '#991b1b' }
            ],
            peakSendingTimes: [
                { hour: '6am', success: 45, failed: 8 },
                { hour: '8am', success: 78, failed: 5 },
                { hour: '10am', success: 125, failed: 7 },
                { hour: '12pm', success: 98, failed: 12 },
                { hour: '2pm', success: 142, failed: 6 },
                { hour: '4pm', success: 115, failed: 9 },
                { hour: '6pm', success: 87, failed: 11 },
                { hour: '8pm', success: 52, failed: 7 }
            ],
            avgResponseTime: 1.8,
            fastestTime: 0.9,
            slowestTime: 4.2
        },

        // Campaign Intelligence
        campaign: {
            campaignComparison: [
                { name: 'Q1 Outreach', successRate: 96.5, avgDuration: 4.2, retryRate: 8.3, totalSent: 1250, color: '#10b981' },
                { name: 'Product Launch', successRate: 94.8, avgDuration: 3.8, retryRate: 12.1, totalSent: 890, color: '#3b82f6' },
                { name: 'Follow-up', successRate: 98.2, avgDuration: 2.1, retryRate: 4.5, totalSent: 620, color: '#8b5cf6' },
                { name: 'Newsletter', successRate: 92.3, avgDuration: 5.6, retryRate: 15.2, totalSent: 2100, color: '#f59e0b' }
            ],
            bestPerforming: [
                { campaign: 'Follow-up', score: 98.2, sent: 620, failed: 11 },
                { campaign: 'Q1 Outreach', score: 96.5, sent: 1250, failed: 44 },
                { campaign: 'Product Launch', score: 94.8, sent: 890, failed: 46 },
                { campaign: 'Newsletter', score: 92.3, sent: 2100, failed: 162 }
            ],
            retryAnalysis: [
                { attempts: '1st Try', success: 2845, failed: 156 },
                { attempts: '2nd Try', success: 98, failed: 58 },
                { attempts: '3rd Try', success: 34, failed: 24 },
                { attempts: '4+ Tries', success: 12, failed: 12 }
            ],
            durationMetrics: { fastest: 2.1, slowest: 5.6, average: 3.9 }
        },

        // Resource Usage
        resource: {
            dailyLimit: { used: 1847, total: 2000, percentage: 92.4 },
            hourlyLimit: { used: 68, total: 100, percentage: 68 },
            sendingVelocity: [
                { time: '00:00', rate: 12 },
                { time: '03:00', rate: 8 },
                { time: '06:00', rate: 45 },
                { time: '09:00', rate: 89 },
                { time: '12:00', rate: 95 },
                { time: '15:00', rate: 78 },
                { time: '18:00', rate: 52 },
                { time: '21:00', rate: 28 }
            ],
            peakUsageHeatmap: [
                { day: 'Mon', '6am': 20, '9am': 65, '12pm': 85, '3pm': 75, '6pm': 45, '9pm': 25 },
                { day: 'Tue', '6am': 25, '9am': 78, '12pm': 92, '3pm': 88, '6pm': 52, '9pm': 30 },
                { day: 'Wed', '6am': 22, '9am': 72, '12pm': 88, '3pm': 82, '6pm': 48, '9pm': 28 },
                { day: 'Thu', '6am': 28, '9am': 85, '12pm': 98, '3pm': 95, '6pm': 58, '9pm': 35 },
                { day: 'Fri', '6am': 30, '9am': 88, '12pm': 95, '3pm': 90, '6pm': 55, '9pm': 32 },
                { day: 'Sat', '6am': 15, '9am': 42, '12pm': 58, '3pm': 52, '6pm': 38, '9pm': 22 },
                { day: 'Sun', '6am': 12, '9am': 38, '12pm': 52, '3pm': 48, '6pm': 35, '9pm': 20 }
            ],
            quotaUtilization: [
                { resource: 'Daily Emails', used: 1847, limit: 2000 },
                { resource: 'Hourly Emails', used: 68, limit: 100 },
                { resource: 'API Calls', used: 3420, limit: 5000 },
                { resource: 'Storage (MB)', used: 245, limit: 500 }
            ]
        },

        // List Quality
        quality: {
            healthScore: 87.5,
            totalContacts: 4850,
            duplicates: { count: 142, percentage: 2.9 },
            domainDistribution: [
                { type: 'Corporate', count: 3245, percentage: 66.9, color: '#3b82f6' },
                { type: 'Personal', count: 1605, percentage: 33.1, color: '#8b5cf6' }
            ],
            lenientProviders: [
                { provider: 'Gmail', count: 1820, percentage: 37.5, deliveryRate: 96.8, color: '#ef4444' },
                { provider: 'Outlook', count: 1245, percentage: 25.7, deliveryRate: 95.2, color: '#3b82f6' },
                { provider: 'Yahoo', count: 485, percentage: 10.0, deliveryRate: 92.1, color: '#8b5cf6' },
                { provider: 'ProtonMail', count: 285, percentage: 5.9, deliveryRate: 97.5, color: '#10b981' },
                { provider: 'Others', count: 1015, percentage: 20.9, deliveryRate: 94.3, color: '#64748b' }
            ],
            qualityTrend: [
                { month: 'Aug', score: 82 },
                { month: 'Sep', score: 84 },
                { month: 'Oct', score: 86 },
                { month: 'Nov', score: 85 },
                { month: 'Dec', score: 87 },
                { month: 'Jan', score: 87.5 }
            ],
            topDomains: [
                { domain: 'company.com', count: 845, quality: 95 },
                { domain: 'business.co', count: 672, quality: 92 },
                { domain: 'enterprise.io', count: 534, quality: 94 },
                { domain: 'startup.tech', count: 428, quality: 89 },
                { domain: 'corp.net', count: 386, quality: 91 }
            ]
        },

        // Predictive Analytics
        predictive: {
            activeCampaigns: [
                { name: 'Q1 Outreach', remaining: 450, estimatedTime: 3.2, probability: 96.5 },
                { name: 'Product Launch', remaining: 280, estimatedTime: 2.1, probability: 94.8 },
                { name: 'Newsletter', remaining: 820, estimatedTime: 5.8, probability: 92.3 }
            ],
            optimalSendTimes: [
                { hour: '9am', successRate: 94.2, volume: 245, recommended: false },
                { hour: '10am', successRate: 96.8, volume: 312, recommended: true },
                { hour: '11am', successRate: 95.5, volume: 289, recommended: true },
                { hour: '2pm', successRate: 97.2, volume: 334, recommended: true },
                { hour: '3pm', successRate: 95.8, volume: 298, recommended: true },
                { hour: '4pm', successRate: 93.1, volume: 267, recommended: false }
            ],
            budgetForecast: [
                { month: 'Feb', estimated: 1250, actual: 0, confidence: 85 },
                { month: 'Mar', estimated: 1420, actual: 0, confidence: 78 },
                { month: 'Apr', estimated: 1380, actual: 0, confidence: 72 },
                { month: 'May', estimated: 1550, actual: 0, confidence: 68 },
                { month: 'Jun', estimated: 1480, actual: 0, confidence: 65 }
            ],
            successProbability: {
                overall: 95.2,
                byDomain: [
                    { domain: 'Corporate', probability: 96.8 },
                    { domain: 'Gmail', probability: 95.5 },
                    { domain: 'Outlook', probability: 94.2 },
                    { domain: 'Yahoo', probability: 91.8 },
                    { domain: 'Others', probability: 93.5 }
                ]
            },
            mlInsights: [
                { insight: 'Best send time', value: '2pm - 3pm', confidence: 94 },
                { insight: 'Optimal batch size', value: '150 emails/hour', confidence: 89 },
                { insight: 'Retry window', value: '24-48 hours', confidence: 92 },
                { insight: 'Peak success day', value: 'Thursday', confidence: 87 }
            ]
        },

        // Real-time Monitoring
        realtime: {
            systemHealth: {
                smtp: { status: 'healthy', uptime: 99.8, latency: 145 },
                api: { status: 'healthy', uptime: 99.9, latency: 89 },
                database: { status: 'healthy', uptime: 100, latency: 12 },
                queue: { status: 'warning', uptime: 98.5, latency: 234 }
            },
            liveActivity: [
                { time: '14:58', campaign: 'Q1 Outreach', sent: 12, status: 'success' },
                { time: '14:57', campaign: 'Product Launch', sent: 8, status: 'success' },
                { time: '14:56', campaign: 'Newsletter', sent: 15, status: 'success' },
                { time: '14:55', campaign: 'Q1 Outreach', sent: 10, status: 'success' },
                { time: '14:54', campaign: 'Follow-up', sent: 6, status: 'warning' }
            ],
            recentAlerts: [
                { type: 'warning', message: 'Approaching hourly limit (85%)', time: '2 min ago', severity: 'medium' },
                { type: 'info', message: 'Campaign "Newsletter" started', time: '15 min ago', severity: 'low' },
                { type: 'success', message: 'Daily backup completed', time: '1 hour ago', severity: 'low' }
            ],
            rateLimitStatus: {
                hourly: { current: 85, limit: 100, percentage: 85, trend: 'increasing' },
                daily: { current: 1847, limit: 2000, percentage: 92.4, trend: 'stable' }
            },
            liveMetrics: [
                { time: '14:50', sent: 45, failed: 2 },
                { time: '14:51', sent: 52, failed: 1 },
                { time: '14:52', sent: 48, failed: 3 },
                { time: '14:53', sent: 61, failed: 2 },
                { time: '14:54', sent: 55, failed: 1 },
                { time: '14:55', sent: 58, failed: 2 },
                { time: '14:56', sent: 63, failed: 1 },
                { time: '14:57', sent: 57, failed: 2 },
                { time: '14:58', sent: 68, failed: 1 }
            ]
        },

        // Overview Mock Data (Fallback)
        overview: {
            emailStats: {
                emailsToday: 342,
                emailsThisHour: 45,
                maxPerDay: 1000,
                maxPerHour: 150,
                history: [
                    { date: new Date(Date.now() - 6 * 86400000).toISOString(), count: 1250 },
                    { date: new Date(Date.now() - 5 * 86400000).toISOString(), count: 1420 },
                    { date: new Date(Date.now() - 4 * 86400000).toISOString(), count: 1180 },
                    { date: new Date(Date.now() - 3 * 86400000).toISOString(), count: 1550 },
                    { date: new Date(Date.now() - 2 * 86400000).toISOString(), count: 1480 },
                    { date: new Date(Date.now() - 1 * 86400000).toISOString(), count: 1620 },
                    { date: new Date().toISOString(), count: 1342 }
                ]
            },
            campaigns: [
                { id: '1', name: 'Product Launch', status: 'In Progress', stats: { sent: 850, failed: 42, pending: 108 } },
                { id: '2', name: 'Newsletter Q1', status: 'Completed', stats: { sent: 2100, failed: 162, pending: 0 } },
                { id: '3', name: 'Follow-up Wave', status: 'Scheduled', stats: { sent: 0, failed: 0, pending: 450 } }
            ]
        }
    }), []);

    // Handle tab change
    const handleTabChange = useCallback((newTab) => {
        setActiveTab(newTab);
        setTabsLoaded(prev => new Set([...prev, newTab]));
    }, []);

    // Handle date range change
    const handleDateRangeChange = useCallback((newRange) => {
        setDateRange(newRange);
        // In a real app, this would trigger data refetch
    }, []);

    // Handle export
    const handleExport = useCallback(() => {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `analytics_${activeTab}_${dateRange}_${timestamp}.csv`;

        // Create CSV content based on active tab
        let csvContent = "data:text/csv;charset=utf-8,";

        switch (activeTab) {
            case 'overview':
                csvContent += "Metric,Value\n";
                csvContent += `Date Range,${dateRange}\n`;
                csvContent += `Total Volume,${emailStats.history?.reduce((sum, item) => sum + item.count, 0) || 0}\n`;
                break;
            case 'validation-delivery':
                csvContent += "Domain,Bounce Rate,Emails\n";
                analyticsData.validation.bounceRateByDomain.forEach(item => {
                    csvContent += `${item.domain},${item.bounceRate},${item.emails}\n`;
                });
                break;
            case 'campaign-intelligence':
                csvContent += "Campaign,Score,Sent,Failed\n";
                analyticsData.campaign.bestPerforming.forEach(item => {
                    csvContent += `${item.campaign},${item.score},${item.sent},${item.failed}\n`;
                });
                break;
            case 'resources-quality':
                csvContent += "Resource,Used,Limit\n";
                analyticsData.resource.quotaUtilization.forEach(item => {
                    csvContent += `${item.resource},${item.used},${item.limit}\n`;
                });
                break;
            case 'predictive-live':
                csvContent += "Campaign,Remaining,Estimated Time,Probability\n";
                analyticsData.predictive.activeCampaigns.forEach(item => {
                    csvContent += `${item.name},${item.remaining},${item.estimatedTime},${item.probability}\n`;
                });
                break;
            default:
                csvContent += "No data available\n";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [activeTab, dateRange, emailStats, analyticsData]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsRefreshing(false);
    }, []);

    // Handle real-time data refresh
    const handleRealtimeRefresh = useCallback(() => {
        // In a real app, this would fetch fresh real-time data
        console.log('Refreshing real-time data...');
    }, []);

    // Render active tab content
    const renderTabContent = () => {
        const commonProps = {
            isLoading: false
        };

        switch (activeTab) {
            case 'overview':
                return (
                    <OverviewTab
                        emailStats={emailStats}
                        campaigns={campaigns}
                        mockOverview={analyticsData.overview}
                        validationData={analyticsData.validation}
                        deliveryData={analyticsData.delivery}
                        campaignData={analyticsData.campaign}
                        resourceData={analyticsData.resource}
                        qualityData={analyticsData.quality}
                        predictiveData={analyticsData.predictive}
                        onNavigateToTab={handleTabChange}
                        {...commonProps}
                    />
                );
            case 'validation-delivery':
                return (
                    <ValidationDeliveryTab
                        validationData={analyticsData.validation}
                        deliveryData={analyticsData.delivery}
                        {...commonProps}
                    />
                );
            case 'campaign-intelligence':
                return (
                    <CampaignIntelligenceTab
                        campaignData={analyticsData.campaign}
                        {...commonProps}
                    />
                );
            case 'resources-quality':
                return (
                    <ResourcesQualityTab
                        resourceData={analyticsData.resource}
                        qualityData={analyticsData.quality}
                        {...commonProps}
                    />
                );
            case 'predictive-live':
                return (
                    <PredictiveLiveTab
                        predictiveData={analyticsData.predictive}
                        realtimeData={analyticsData.realtime}
                        onRefreshRealtime={handleRealtimeRefresh}
                        autoRefreshInterval={60000}
                        {...commonProps}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <AnalyticsHeader
                title="Deep Analytics"
                description="Deep-dive into campaign performance & engagement trends"
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                onExport={handleExport}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            {/* Tab Navigation */}
            <AnalyticsTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            {/* Tab Content */}
            <Suspense fallback={<SkeletonLoader count={3} height={300} />}>
                {renderTabContent()}
            </Suspense>
        </div>
    );
};

export default Analytics;
