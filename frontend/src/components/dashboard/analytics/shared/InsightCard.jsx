import PropTypes from 'prop-types';
import { ArrowRight } from 'lucide-react';

const InsightCard = ({ title, value, description, link, onLinkClick }) => {
    return (
        <div className="card" style={{ 
            padding: '16px', 
            margin: 0,
            cursor: link ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
        }}
        onClick={link && onLinkClick ? () => onLinkClick(link) : undefined}
        onMouseEnter={(e) => {
            if (link) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }
        }}
        onMouseLeave={(e) => {
            if (link) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }
        }}
        >
            <div style={{ marginBottom: '8px' }}>
                <p style={{ 
                    fontSize: '11px', 
                    fontWeight: '600', 
                    color: 'var(--text-secondary)', 
                    textTransform: 'uppercase',
                    margin: 0
                }}>
                    {title}
                </p>
            </div>
            <div style={{ marginBottom: '8px' }}>
                <h4 style={{ 
                    fontSize: '24px', 
                    fontWeight: '800', 
                    color: 'var(--secondary-color)', 
                    margin: 0 
                }}>
                    {value}
                </h4>
            </div>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)', 
                    margin: 0 
                }}>
                    {description}
                </p>
                {link && (
                    <ArrowRight size={16} style={{ color: 'var(--primary-color)' }} />
                )}
            </div>
        </div>
    );
};

InsightCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    description: PropTypes.string.isRequired,
    link: PropTypes.string,
    onLinkClick: PropTypes.func
};

export default InsightCard;
