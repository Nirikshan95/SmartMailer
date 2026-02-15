import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import SkeletonLoader from '../shared/SkeletonLoader';

// Lazy load section component
const CampaignIntelligence = lazy(() => import('../sections/CampaignIntelligence'));

const CampaignIntelligenceTab = ({ 
    campaignData, 
    isLoading = false 
}) => {
    return (
        <div 
            role="tabpanel"
            id="campaign-intelligence-panel"
            aria-labelledby="campaign-intelligence-tab"
            style={{ paddingTop: '8px' }}
        >
            {isLoading ? (
                <SkeletonLoader count={3} height={300} />
            ) : (
                <Suspense fallback={<SkeletonLoader count={2} height={280} />}>
                    <CampaignIntelligence 
                        data={campaignData}
                        isLoading={isLoading}
                    />
                </Suspense>
            )}
        </div>
    );
};

CampaignIntelligenceTab.propTypes = {
    campaignData: PropTypes.object,
    isLoading: PropTypes.bool
};

export default CampaignIntelligenceTab;
