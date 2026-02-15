import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import SkeletonLoader from '../shared/SkeletonLoader';

// Lazy load section components
const EmailValidationMetrics = lazy(() => import('../sections/EmailValidationMetrics'));
const DeliveryPerformance = lazy(() => import('../sections/DeliveryPerformance'));

const ValidationDeliveryTab = ({ 
    validationData, 
    deliveryData, 
    isLoading = false 
}) => {
    return (
        <div 
            role="tabpanel"
            id="validation-delivery-panel"
            aria-labelledby="validation-delivery-tab"
            style={{ paddingTop: '8px' }}
        >
            {isLoading ? (
                <SkeletonLoader count={3} height={300} />
            ) : (
                <>
                    {/* Email Validation Metrics Section */}
                    <Suspense fallback={<SkeletonLoader count={2} height={280} />}>
                        <EmailValidationMetrics 
                            data={validationData}
                            isLoading={isLoading}
                        />
                    </Suspense>

                    {/* Delivery Performance Section */}
                    <Suspense fallback={<SkeletonLoader count={2} height={280} />}>
                        <DeliveryPerformance 
                            data={deliveryData}
                            isLoading={isLoading}
                        />
                    </Suspense>
                </>
            )}
        </div>
    );
};

ValidationDeliveryTab.propTypes = {
    validationData: PropTypes.object,
    deliveryData: PropTypes.object,
    isLoading: PropTypes.bool
};

export default ValidationDeliveryTab;
