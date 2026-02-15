// Aggregate data by key
export const aggregateBy = (data, key, valueKey) => {
    if (!data || !Array.isArray(data)) return {};
    
    return data.reduce((acc, item) => {
        const groupKey = item[key];
        if (!acc[groupKey]) {
            acc[groupKey] = 0;
        }
        acc[groupKey] += item[valueKey] || 0;
        return acc;
    }, {});
};

// Calculate sum of array
export const sum = (arr, key) => {
    if (!arr || !Array.isArray(arr)) return 0;
    
    if (key) {
        return arr.reduce((total, item) => total + (item[key] || 0), 0);
    }
    return arr.reduce((total, item) => total + (item || 0), 0);
};

// Calculate average
export const average = (arr, key) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
    
    const total = sum(arr, key);
    return total / arr.length;
};

// Filter data by date range
export const filterByDateRange = (data, dateKey, range) => {
    if (!data || !Array.isArray(data)) return [];
    
    const now = new Date();
    let cutoffDate;
    
    switch (range) {
        case '7d':
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case '30d':
            cutoffDate = new Date(now.setDate(now.getDate() - 30));
            break;
        case 'all':
            return data;
        default:
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
    }
    
    return data.filter(item => new Date(item[dateKey]) >= cutoffDate);
};

// Sort data
export const sortBy = (data, key, order = 'asc') => {
    if (!data || !Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (order === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
};

// Group data by time period
export const groupByTimePeriod = (data, dateKey, period = 'day') => {
    if (!data || !Array.isArray(data)) return [];
    
    const grouped = {};
    
    data.forEach(item => {
        const date = new Date(item[dateKey]);
        let key;
        
        switch (period) {
            case 'hour':
                key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
                break;
            case 'day':
                key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                break;
            case 'week':
                const weekNum = Math.floor(date.getDate() / 7);
                key = `${date.getFullYear()}-${date.getMonth()}-W${weekNum}`;
                break;
            case 'month':
                key = `${date.getFullYear()}-${date.getMonth()}`;
                break;
            default:
                key = date.toISOString().split('T')[0];
        }
        
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });
    
    return Object.entries(grouped).map(([key, items]) => ({
        period: key,
        items: items,
        count: items.length
    }));
};

// Find top N items
export const topN = (data, key, n = 5, order = 'desc') => {
    if (!data || !Array.isArray(data)) return [];
    
    const sorted = sortBy(data, key, order);
    return sorted.slice(0, n);
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
};

// Remove duplicates
export const removeDuplicates = (data, key) => {
    if (!data || !Array.isArray(data)) return [];
    
    const seen = new Set();
    return data.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
};

// Merge datasets
export const mergeDatasets = (data1, data2, key) => {
    if (!data1 || !data2) return data1 || data2 || [];
    
    const merged = [...data1];
    const keys = new Set(data1.map(item => item[key]));
    
    data2.forEach(item => {
        if (!keys.has(item[key])) {
            merged.push(item);
        }
    });
    
    return merged;
};

// Fill missing dates in time series
export const fillMissingDates = (data, dateKey, startDate, endDate) => {
    if (!data || !Array.isArray(data)) return [];
    
    const filled = [];
    const dataMap = new Map(data.map(item => [item[dateKey], item]));
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (dataMap.has(dateStr)) {
            filled.push(dataMap.get(dateStr));
        } else {
            filled.push({ [dateKey]: dateStr, value: 0 });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return filled;
};

export default {
    aggregateBy,
    sum,
    average,
    filterByDateRange,
    sortBy,
    groupByTimePeriod,
    topN,
    calculatePercentage,
    removeDuplicates,
    mergeDatasets,
    fillMissingDates
};
