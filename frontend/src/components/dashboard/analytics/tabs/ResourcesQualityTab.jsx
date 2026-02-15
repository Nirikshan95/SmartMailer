import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';
import SkeletonLoader from '../shared/SkeletonLoader';

// Lazy load section components
const ResourceUsage = lazy(() => import('../sections/ResourceUsage'));
const ListQualityMetrics = lazy(() => import('../sections/ListQualityMetrics'));

const ResourcesQualityTab = ({ 
    resourceData, 
    qualityData, 
    isLoading = false 
}) => {
    // Check for resource warnings
    const hasResourceWarning = resourceData && (
        resourceData.dailyLimit?.percentage > 80 || 
        resourceData.hourlyLimit?.percentage > 80
    );

    return (
        <div 
            role="tabpanel"
            id="resources-quality-panel"
            aria-labelledby="resources-quality-tab"
            style={{ paddingTop: '8px' }}
        >
            {/* Warning Banner */}
            {hasResourceWarning && !isLoading && (
                <div style={{
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #fef3c715 0%, #fee2e215 100%)',
                    border: '1px solid #f59e0b40',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div>
                        <p style={{ 
                            fontSize: '14px', 
                            fontWeight: '700', 
                            color: '#f59e0b', 
                            margin: 0,
                            marginBottom: '4px'
                        }}>
                            Resource Limit Warning
                        </p>
                        <p style={{ 
                            fontSize: '13px', 
                            color: 'var(--text-secondary)', 
                            margin: 0 
                        }}>
                            You are approaching your {resourceData.dailyLimit?.percentage > 80 ? 'daily' : 'hourly'} sending limit. 
                            Consider upgrading your plan or adjusting your sending schedule.
                        </p>
                    </div>
                </div>
            )}

            {isLoading ? (
                <SkeletonLoader count={3} height={300} />
            ) : (
                <>
                    {/* Resource Usage Section */}
                    <Suspense fallback={<SkeletonLoader count={2} height={280} />}>
                        <ResourceUsage 
                            data={resourceData}
                            isLoading={isLoading}
                        />
                    </Suspense>

                    {/* List Quality Metrics Section */}
                    <Suspense fallback={<SkeletonLoader count={2} height={280} />}>
                        <ListQualityMetrics 
                            data={qualityData}
                            isLoading={isLoading}
                        />
                    </Suspense>
                </>
            )}
        </div>
    );
};

ResourcesQualityTab.propTypes = {
    resourceData: PropTypes.object,
    qualityData: PropTypes.object,
    isLoading: PropTypes.bool
};

export default ResourcesQualityTab;
