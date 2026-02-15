// Convert data to CSV format
export const convertToCSV = (data, headers = null) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return '';
    }
    
    // Auto-generate headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Create header row
    const headerRow = csvHeaders.join(',');
    
    // Create data rows
    const dataRows = data.map(row => {
        return csvHeaders.map(header => {
            const value = row[header];
            
            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }
            
            // Handle strings with commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
        }).join(',');
    });
    
    return [headerRow, ...dataRows].join('\n');
};

// Download CSV file
export const downloadCSV = (csvContent, filename = 'export.csv') => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Export data as CSV
export const exportToCSV = (data, filename, headers = null) => {
    const csvContent = convertToCSV(data, headers);
    downloadCSV(csvContent, filename);
};

// Serialize data for export
export const serializeData = (data, options = {}) => {
    const {
        includeTimestamp = true,
        flattenNested = true,
        dateFormat = 'iso'
    } = options;
    
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => {
        const serialized = {};
        
        Object.entries(item).forEach(([key, value]) => {
            // Handle dates
            if (value instanceof Date) {
                serialized[key] = dateFormat === 'iso' 
                    ? value.toISOString() 
                    : value.toLocaleDateString();
            }
            // Handle nested objects
            else if (flattenNested && typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                    serialized[`${key}_${nestedKey}`] = nestedValue;
                });
            }
            // Handle arrays
            else if (Array.isArray(value)) {
                serialized[key] = value.join('; ');
            }
            // Handle primitives
            else {
                serialized[key] = value;
            }
        });
        
        // Add timestamp if requested
        if (includeTimestamp) {
            serialized.exported_at = new Date().toISOString();
        }
        
        return serialized;
    });
};

// Generate filename with timestamp
export const generateFilename = (baseName, extension = 'csv') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    return `${baseName}_${timestamp}.${extension}`;
};

// Export chart data
export const exportChartData = (chartData, chartName) => {
    const filename = generateFilename(`${chartName}_data`);
    exportToCSV(chartData, filename);
};

// Export table data
export const exportTableData = (tableData, tableName, columns = null) => {
    const filename = generateFilename(`${tableName}_data`);
    const headers = columns ? columns.map(col => col.header || col.key) : null;
    exportToCSV(tableData, filename, headers);
};

// Prepare analytics export
export const prepareAnalyticsExport = (analyticsData, tabName, dateRange) => {
    const filename = generateFilename(`analytics_${tabName}_${dateRange}`);
    const serialized = serializeData(analyticsData, {
        includeTimestamp: true,
        flattenNested: true
    });
    return { data: serialized, filename };
};

// Export multiple datasets as separate CSV files
export const exportMultipleDatasets = (datasets) => {
    datasets.forEach(({ data, name, headers }) => {
        const filename = generateFilename(name);
        exportToCSV(data, filename, headers);
    });
};

export default {
    convertToCSV,
    downloadCSV,
    exportToCSV,
    serializeData,
    generateFilename,
    exportChartData,
    exportTableData,
    prepareAnalyticsExport,
    exportMultipleDatasets
};
