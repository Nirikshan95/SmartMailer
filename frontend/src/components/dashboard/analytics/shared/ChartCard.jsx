import PropTypes from 'prop-types';

const ChartCard = ({ title, children, actions, icon: Icon }) => {
    return (
        <div className="card" style={{ padding: '24px', margin: 0 }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icon && <Icon size={18} style={{ color: 'var(--primary-color)' }} />}
                    <h3 style={{ 
                        fontSize: '15px', 
                        fontWeight: '700', 
                        color: 'var(--secondary-color)', 
                        margin: 0 
                    }}>
                        {title}
                    </h3>
                </div>
                {actions && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {actions}
                    </div>
                )}
            </div>
            <div>
                {children}
            </div>
        </div>
    );
};

ChartCard.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    actions: PropTypes.node,
    icon: PropTypes.elementType
};

export default ChartCard;
