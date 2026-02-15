import PropTypes from 'prop-types';
import { Inbox } from 'lucide-react';

const EmptyState = ({ message = 'No data available', icon: Icon = Inbox, action }) => {
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center'
        }}>
            <div style={{ 
                padding: '20px', 
                borderRadius: '50%', 
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                marginBottom: '20px'
            }}>
                <Icon size={48} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <p style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--secondary-color)', 
                marginBottom: '8px',
                margin: 0
            }}>
                {message}
            </p>
            <p style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)', 
                marginBottom: '20px',
                margin: 0,
                marginTop: '8px'
            }}>
                Try adjusting your filters or date range
            </p>
            {action && (
                <div style={{ marginTop: '12px' }}>
                    {action}
                </div>
            )}
        </div>
    );
};

EmptyState.propTypes = {
    message: PropTypes.string,
    icon: PropTypes.elementType,
    action: PropTypes.node
};

export default EmptyState;
