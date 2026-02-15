import PropTypes from 'prop-types';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const renderCardSkeleton = () => (
        <div className="card" style={{ padding: '20px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ 
                        width: '60%', 
                        height: '12px', 
                        background: '#f1f5f9', 
                        borderRadius: '4px',
                        marginBottom: '12px',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    <div style={{ 
                        width: '40%', 
                        height: '32px', 
                        background: '#f1f5f9', 
                        borderRadius: '4px',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                </div>
                <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: '#f1f5f9', 
                    borderRadius: '12px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                }} />
            </div>
        </div>
    );

    const renderChartSkeleton = () => (
        <div className="card" style={{ padding: '24px', margin: 0 }}>
            <div style={{ 
                width: '30%', 
                height: '16px', 
                background: '#f1f5f9', 
                borderRadius: '4px',
                marginBottom: '20px',
                animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{ 
                width: '100%', 
                height: '280px', 
                background: '#f1f5f9', 
                borderRadius: '8px',
                animation: 'pulse 1.5s ease-in-out infinite'
            }} />
        </div>
    );

    const renderTableSkeleton = () => (
        <div className="card" style={{ padding: '24px', margin: 0 }}>
            <div style={{ 
                width: '30%', 
                height: '16px', 
                background: '#f1f5f9', 
                borderRadius: '4px',
                marginBottom: '20px',
                animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            {[...Array(5)].map((_, idx) => (
                <div key={idx} style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginBottom: '12px' 
                }}>
                    <div style={{ 
                        flex: 1, 
                        height: '40px', 
                        background: '#f1f5f9', 
                        borderRadius: '6px',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    <div style={{ 
                        flex: 1, 
                        height: '40px', 
                        background: '#f1f5f9', 
                        borderRadius: '6px',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    <div style={{ 
                        flex: 1, 
                        height: '40px', 
                        background: '#f1f5f9', 
                        borderRadius: '6px',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                </div>
            ))}
        </div>
    );

    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return renderCardSkeleton();
            case 'chart':
                return renderChartSkeleton();
            case 'table':
                return renderTableSkeleton();
            default:
                return renderCardSkeleton();
        }
    };

    return (
        <>
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
            {[...Array(count)].map((_, idx) => (
                <div key={idx}>
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
};

SkeletonLoader.propTypes = {
    type: PropTypes.oneOf(['card', 'chart', 'table']),
    count: PropTypes.number
};

export default SkeletonLoader;
