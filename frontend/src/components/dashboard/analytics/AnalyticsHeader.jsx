import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Download, RefreshCw } from 'lucide-react';

const AnalyticsHeader = ({ 
    title = 'Deep Analytics',
    description = 'Deep-dive into campaign performance & engagement trends',
    dateRange,
    onDateRangeChange,
    onExport,
    onRefresh,
    isRefreshing = false,
    showExport = true,
    showRefresh = true,
    showDateRange = true
}) => {
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsSticky(scrollPosition > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div 
            style={{ 
                position: isSticky ? 'sticky' : 'relative',
                top: isSticky ? '0' : 'auto',
                zIndex: isSticky ? 100 : 'auto',
                background: isSticky ? 'var(--card-bg)' : 'transparent',
                padding: isSticky ? '16px 0' : '0',
                marginBottom: '32px',
                transition: 'all 0.3s ease',
                boxShadow: isSticky ? 'var(--shadow-md)' : 'none',
                borderRadius: isSticky ? '8px' : '0'
            }}
        >
            <div 
                className="page-header" 
                style={{ 
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '20px',
                    flexWrap: 'wrap',
                    margin: 0
                }}
            >
                {/* Title Section */}
                <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <h1 
                        className="page-title" 
                        style={{ 
                            fontSize: isSticky ? '20px' : '28px',
                            transition: 'font-size 0.3s ease',
                            margin: 0,
                            marginBottom: '4px'
                        }}
                    >
                        {title}
                    </h1>
                    {!isSticky && (
                        <p style={{ 
                            color: 'var(--text-secondary)', 
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            {description}
                        </p>
                    )}
                </div>

                {/* Actions Section */}
                <div 
                    style={{ 
                        display: 'flex', 
                        gap: '12px',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}
                >
                    {/* Date Range Filter */}
                    {showDateRange && (
                        <select 
                            className="select" 
                            value={dateRange} 
                            onChange={(e) => onDateRangeChange(e.target.value)} 
                            style={{ 
                                width: '150px',
                                padding: '10px 14px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--card-bg)',
                                color: 'var(--secondary-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            aria-label="Select date range"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    )}

                    {/* Refresh Button */}
                    {showRefresh && (
                        <button 
                            className="btn btn-outline" 
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--card-bg)',
                                color: 'var(--secondary-color)',
                                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: isRefreshing ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!isRefreshing) {
                                    e.currentTarget.style.background = 'var(--surface-color)';
                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isRefreshing) {
                                    e.currentTarget.style.background = 'var(--card-bg)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }
                            }}
                            aria-label={isRefreshing ? 'Refreshing data' : 'Refresh data'}
                        >
                            <RefreshCw 
                                size={18} 
                                style={{
                                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                                }}
                            />
                            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                    )}

                    {/* Export Button */}
                    {showExport && (
                        <button 
                            className="btn btn-outline" 
                            onClick={onExport}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--card-bg)',
                                color: 'var(--secondary-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--surface-color)';
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--card-bg)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                            aria-label="Export analytics data"
                        >
                            <Download size={18} />
                            <span>Export</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Add CSS animation for spinning refresh icon */}
            <style>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

AnalyticsHeader.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    dateRange: PropTypes.string.isRequired,
    onDateRangeChange: PropTypes.func.isRequired,
    onExport: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    isRefreshing: PropTypes.bool,
    showExport: PropTypes.bool,
    showRefresh: PropTypes.bool,
    showDateRange: PropTypes.bool
};

export default AnalyticsHeader;
