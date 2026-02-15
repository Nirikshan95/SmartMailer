import { lazy, Suspense, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import SkeletonLoader from '../shared/SkeletonLoader';

// Lazy load section components
const PredictiveAnalytics = lazy(() => import('../sections/PredictiveAnalytics'));
const RealtimeMonitoring = lazy(() => import('../sections/RealtimeMonitoring'));

const PredictiveLiveTab = ({ 
    predictiveData, 
    realtimeData, 
    isLoading = false,
    onRefreshRealtime,
    autoRefreshInterval = 60000 // 60 seconds default
}) => {
    const intervalRef = useRef(null);

    useEffect(() => {
        // Set up auto-refresh for real-time data
        if (onRefreshRealtime && autoRefreshInterval > 0) {
            intervalRef.current = setInterval(() => {
                onRefreshRealtime();
            }, autoRefreshInterval);
        }

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [onRefreshRealtime, autoRefreshInterval]);

    return (
        <div 
            role="tabpanel"
            id="predictive-live-panel"
            aria-labelledby="predictive-live-tab"
            style={{ paddingTop: '8px' }}
        >
            {isLoading ? (
                <SkeletonLoader count={3} height={300} />
            ) : (
                <>
                    {/* Predictive Analytics Section */}
                    <Suspense fallback={<SkeletonLoader count={2} height={280} />}>
                        <PredictiveAnalytics 
                            data={predictiveData}
                            isLoading={isLoading}
                        />
                    </Suspense>

                    {/* Real-time Monitoring Section */}
                    <Suspense fallback={<SkeletonLoader count={2} height={280} />}>
                        <RealtimeMonitoring 
                            data={realtimeData}
                            isLoading={isLoading}
                        />
                    </Suspense>

                    {/* Auto-refresh indicator */}
                    {onRefreshRealtime && (
                        <div style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            padding: '10px 16px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            zIndex: 50
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#10b981',
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            }} />
                            <span>Auto-refreshing every {autoRefreshInterval / 1000}s</span>
                            
                            <style>{`
                                @keyframes pulse {
                                    0%, 100% {
                                        opacity: 1;
                                    }
                                    50% {
                                        opacity: 0.5;
                                    }
                                }
                            `}</style>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

PredictiveLiveTab.propTypes = {
    predictiveData: PropTypes.object,
    realtimeData: PropTypes.object,
    isLoading: PropTypes.bool,
    onRefreshRealtime: PropTypes.func,
    autoRefreshInterval: PropTypes.number
};

export default PredictiveLiveTab;
