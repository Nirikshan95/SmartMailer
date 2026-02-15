// Color palette for charts
export const CHART_COLORS = {
    primary: 'var(--primary-color)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    gray: '#64748b'
};

// Get color by index for multi-series charts
export const getColorByIndex = (index) => {
    const colors = [
        '#10b981', // green
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#f59e0b', // orange
        '#ef4444', // red
        '#06b6d4', // cyan
        '#ec4899', // pink
        '#64748b'  // gray
    ];
    return colors[index % colors.length];
};

// Format number with commas
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%';
    return `${Number(value).toFixed(decimals)}%`;
};

// Format currency
export const formatCurrency = (value, currency = 'USD') => {
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

// Format date for charts
export const formatChartDate = (date, format = 'short') => {
    const d = new Date(date);
    
    if (format === 'short') {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (format === 'long') {
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (format === 'time') {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    return d.toLocaleDateString();
};

// Custom tooltip formatter
export const customTooltipFormatter = (value, name, props) => {
    if (name.toLowerCase().includes('rate') || name.toLowerCase().includes('percentage')) {
        return [formatPercentage(value), name];
    } else if (name.toLowerCase().includes('price') || name.toLowerCase().includes('cost')) {
        return [formatCurrency(value), name];
    } else {
        return [formatNumber(value), name];
    }
};

// Truncate long labels
export const truncateLabel = (label, maxLength = 20) => {
    if (!label) return '';
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength) + '...';
};

// Calculate trend
export const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, isPositive: true };
    
    const change = ((current - previous) / previous) * 100;
    return {
        value: Math.abs(change).toFixed(1),
        isPositive: change >= 0
    };
};

// Generate gradient ID for charts
export const generateGradientId = (name) => {
    return `gradient-${name.toLowerCase().replace(/\s+/g, '-')}`;
};

// Responsive chart height
export const getResponsiveChartHeight = (windowWidth) => {
    if (windowWidth < 640) return 200; // mobile
    if (windowWidth < 1024) return 250; // tablet
    return 300; // desktop
};

export default {
    CHART_COLORS,
    getColorByIndex,
    formatNumber,
    formatPercentage,
    formatCurrency,
    formatChartDate,
    customTooltipFormatter,
    truncateLabel,
    calculateTrend,
    generateGradientId,
    getResponsiveChartHeight
};
