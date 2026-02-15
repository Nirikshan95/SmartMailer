import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BarChart2, Shield, Target, Gauge, Brain, Radio } from 'lucide-react';

const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'validation-delivery', label: 'Validation & Delivery', icon: Shield },
    { id: 'campaign-intelligence', label: 'Campaign Intelligence', icon: Target },
    { id: 'resources-quality', label: 'Resources & Quality', icon: Gauge },
    { id: 'predictive-live', label: 'Predictive & Live', icon: Brain }
];

const AnalyticsTabs = ({ activeTab, onTabChange }) => {
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const tabRefs = useRef({});
    const containerRef = useRef(null);

    useEffect(() => {
        // Update indicator position when active tab changes
        const activeTabElement = tabRefs.current[activeTab];
        if (activeTabElement) {
            setIndicatorStyle({
                left: activeTabElement.offsetLeft,
                width: activeTabElement.offsetWidth
            });
        }
    }, [activeTab]);

    const handleKeyDown = (e, tabId, index) => {
        let newIndex = index;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = index > 0 ? index - 1 : tabs.length - 1;
                break;
            case 'ArrowRight':
                e.preventDefault();
                newIndex = index < tabs.length - 1 ? index + 1 : 0;
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = tabs.length - 1;
                break;
            default:
                return;
        }

        const newTab = tabs[newIndex];
        onTabChange(newTab.id);
        
        // Focus the new tab
        setTimeout(() => {
            tabRefs.current[newTab.id]?.focus();
        }, 0);
    };

    return (
        <div 
            ref={containerRef}
            style={{ 
                position: 'relative',
                borderBottom: '2px solid var(--border-color)',
                marginBottom: '32px',
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin'
            }}
            role="tablist"
            aria-label="Analytics sections"
        >
            <div style={{ 
                display: 'flex',
                gap: '8px',
                minWidth: 'fit-content',
                position: 'relative'
            }}>
                {tabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                        <button
                            key={tab.id}
                            ref={el => tabRefs.current[tab.id] = el}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`${tab.id}-panel`}
                            id={`${tab.id}-tab`}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => onTabChange(tab.id)}
                            onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '14px 20px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '3px solid transparent',
                                color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontSize: '14px',
                                fontWeight: isActive ? '700' : '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                                position: 'relative',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'var(--secondary-color)';
                                    e.currentTarget.style.background = 'var(--surface-color)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.outline = '2px solid var(--primary-color)';
                                e.currentTarget.style.outlineOffset = '2px';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.outline = 'none';
                            }}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
                
                {/* Active indicator */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-2px',
                        height: '3px',
                        background: 'var(--primary-color)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: '3px 3px 0 0',
                        ...indicatorStyle
                    }}
                    aria-hidden="true"
                />
            </div>
        </div>
    );
};

AnalyticsTabs.propTypes = {
    activeTab: PropTypes.oneOf(['overview', 'validation-delivery', 'campaign-intelligence', 'resources-quality', 'predictive-live']).isRequired,
    onTabChange: PropTypes.func.isRequired
};

export default AnalyticsTabs;
