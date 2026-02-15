import PropTypes from 'prop-types';

const KPICard = ({ title, value, icon: Icon, trend, color = 'var(--primary-color)', isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="card" style={{ padding: '20px', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ 
                            width: '60%', 
                            height: '12px', 
                            background: '#f1f5f9', 
                            borderRadius: '4px',
                            marginBottom: '12px'
                        }} />
                        <div style={{ 
                            width: '40%', 
                            height: '32px', 
                            background: '#f1f5f9', 
                            borderRadius: '4px'
                        }} />
                    </div>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        background: '#f1f5f9', 
                        borderRadius: '12px'
                    }} />
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: '20px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: 'var(--text-secondary)', 
                        textTransform: 'uppercase', 
                        marginBottom: '8px',
                        margin: 0
                    }}>
                        {title}
                    </p>
                    <h3 style={{ 
                        fontSize: '32px', 
                        fontWeight: '800', 
                        color: color, 
                        margin: 0,
                        marginTop: '8px'
                    }}>
                        {value}
                    </h3>
                    {trend && (
                        <p style={{ 
                            fontSize: '11px', 
                            color: trend.isPositive ? '#10b981' : '#ef4444', 
                            margin: 0,
                            marginTop: '8px',
                            fontWeight: '600'
                        }}>
                            {trend.isPositive ? '↑' : '↓'} {trend.text}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div style={{ 
                        padding: '12px', 
                        borderRadius: '12px', 
                        background: 'var(--surface-color)', 
                        border: '1px solid var(--border-color)',
                        color: color
                    }}>
                        <Icon size={24} />
                    </div>
                )}
            </div>
        </div>
    );
};

KPICard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType,
    trend: PropTypes.shape({
        text: PropTypes.string.isRequired,
        isPositive: PropTypes.bool.isRequired
    }),
    color: PropTypes.string,
    isLoading: PropTypes.bool
};

export default KPICard;
