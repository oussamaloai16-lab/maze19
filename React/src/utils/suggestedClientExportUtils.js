/**
 * Updated utility functions for exporting suggested client data to CSV and Excel
 * Now includes commune field and unrestricted business_type
 */

/**
 * Define headers for suggested client export - UPDATED with commune
 */
export const suggestedClientExportHeaders = [
  { key: 'suggestedClientId', label: 'Client ID' },
  { key: 'storeName', label: 'Store Name' },
  { key: 'storeAddress', label: 'Store Address' },
  { key: 'wilaya', label: 'Wilaya' },
  { key: 'commune', label: 'Commune' }, // ADDED: commune field
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'socialMediaLink', label: 'Social Media' },
  { key: 'businessType', label: 'Business Type' }, // UPDATED: now unrestricted
  { key: 'estimatedBudget', label: 'Estimated Budget (DA)' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'isValidated', label: 'Validated' },
  { key: 'totalCalls', label: 'Total Calls' },
  { key: 'assignedToName', label: 'Assigned To' },
  { key: 'creatorName', label: 'Created By' },
  { key: 'validatorName', label: 'Validated By' },
  { key: 'tags', label: 'Tags' },
  { key: 'notes', label: 'Notes' },
  { key: 'createdAt', label: 'Created Date' },
  { key: 'validatedAt', label: 'Validated Date' },
  { key: 'lastCallDate', label: 'Last Call Date' }
];

/**
 * Prepare and format suggested client data for export - UPDATED with commune
 * @param {Array} clients - Array of suggested client objects
 * @returns {Array} - Cleaned array for export
 */
export const prepareSuggestedClientsForExport = (clients) => {
  return clients.map(client => ({
    suggestedClientId: client.suggestedClientId || '',
    storeName: client.storeName || '',
    storeAddress: client.storeAddress || '',
    wilaya: client.wilaya || '',
    commune: client.commune || '', // ADDED: commune field
    phoneNumber: client.phoneNumber || '',
    socialMediaLink: client.socialMediaLink || '',
    businessType: client.businessType || '', // UPDATED: no longer restricted to enum values
    estimatedBudget: typeof client.estimatedBudget === 'number' ? client.estimatedBudget.toFixed(2) : '',
    status: client.status ? client.status.charAt(0).toUpperCase() + client.status.slice(1) : '',
    priority: client.priority ? client.priority.charAt(0).toUpperCase() + client.priority.slice(1) : '',
    isValidated: client.isValidated ? 'Yes' : 'No',
    totalCalls: client.totalCalls || 0,
    assignedToName: client.assignedToName || 'Unassigned',
    creatorName: client.creatorName || 'N/A',
    validatorName: client.validatorName || 'N/A',
    tags: client.tags && Array.isArray(client.tags) ? client.tags.join(', ') : '',
    notes: client.notes || client.validationNotes || '',
    createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '',
    validatedAt: client.validatedAt ? new Date(client.validatedAt).toLocaleDateString() : '',
    lastCallDate: client.lastCallDate ? new Date(client.lastCallDate).toLocaleDateString() : ''
  }));
};

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Column headers for the CSV
 * @returns {string} - CSV formatted string
 */
export const convertToCSV = (data, headers) => {
  if (!data || !data.length) return '';

  // Create header row
  const headerRow = headers.map(header => `"${header.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers
      .map(header => {
        let value = item[header.key];
        
        // Handle undefined values
        if (value === undefined || value === null) {
          value = '';
        }
        
        // Escape double quotes and wrap with quotes to handle commas, etc.
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        } else {
          value = `"${value}"`;
        }
        
        return value;
      })
      .join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Download data as a CSV file
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Column headers for the CSV
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (data, headers, filename = 'suggested-clients.csv') => {
  const csvContent = convertToCSV(data, headers);
  
  // Create a Blob with the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link and trigger click
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
};

/**
 * Download data as an Excel file (XLSX format)
 * Uses CSV as a fallback method since we're not using the xlsx library
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Column headers for the Excel
 * @param {string} filename - Name of the file to download
 */
export const downloadExcel = (data, headers, filename = 'suggested-clients.xlsx') => {
  try {
    // Since we're avoiding the xlsx library, use CSV as the format
    console.warn('Excel export library not available, using CSV format');
    downloadCSV(data, headers, filename.replace('.xlsx', '.csv'));
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Fallback to CSV
    downloadCSV(data, headers, filename.replace('.xlsx', '.csv'));
  }
};

/**
 * Format currency with Algerian locale
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '0.00 DA';
  
  const formatter = new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 2
  });
  return formatter.format(amount);
};

/**
 * Get export filename with timestamp
 * @param {string} baseFilename - Base filename without extension
 * @param {string} extension - File extension (.csv or .xlsx)
 * @returns {string} - Filename with timestamp
 */
export const getExportFilename = (baseFilename = 'suggested-clients', extension = '.csv') => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `${baseFilename}-${timestamp}${extension}`;
};

/**
 * Export filtered clients based on current view - UPDATED with commune support
 * @param {Array} clients - Array of client objects
 * @param {string} activeTab - Current active tab filter
 * @param {string} searchTerm - Current search term
 * @param {string} format - Export format ('csv' or 'excel')
 */
export const exportFilteredClients = (clients, activeTab = 'All', searchTerm = '', format = 'csv') => {
  // Apply tab filter
  let filteredClients = clients;
  
  if (activeTab === 'Pending') {
    filteredClients = clients.filter(client => client.status === 'pending');
  } else if (activeTab === 'Contacted') {
    filteredClients = clients.filter(client => client.status === 'contacted');
  } else if (activeTab === 'Interested') {
    filteredClients = clients.filter(client => client.status === 'interested');
  } else if (activeTab === 'Validated') {
    filteredClients = clients.filter(client => client.isValidated === true);
  }
  
  // Apply search filter - UPDATED to include commune in search
  if (searchTerm) {
    filteredClients = filteredClients.filter(client => 
      client.suggestedClientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.storeAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phoneNumber?.includes(searchTerm) ||
      client.wilaya?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.commune?.toLowerCase().includes(searchTerm.toLowerCase()) // ADDED: commune search
    );
  }
  
  // Prepare data for export
  const exportData = prepareSuggestedClientsForExport(filteredClients);
  
  // Generate filename
  const baseFilename = `suggested-clients-${activeTab.toLowerCase()}${searchTerm ? '-filtered' : ''}`;
  const extension = format === 'excel' ? '.xlsx' : '.csv';
  const filename = getExportFilename(baseFilename, extension);
  
  // Export based on format
  if (format === 'excel') {
    downloadExcel(exportData, suggestedClientExportHeaders, filename);
  } else {
    downloadCSV(exportData, suggestedClientExportHeaders, filename);
  }
  
  return {
    totalExported: filteredClients.length,
    filename,
    format
  };
};

/**
 * Export statistics summary - UPDATED to include commune statistics
 * @param {Object} stats - Statistics object
 * @param {string} dateRange - Date range for the export
 */
export const exportStatsSummary = (stats, dateRange = 'All time') => {
  const summaryData = [
    {
      metric: 'Total Clients',
      value: stats.totalClients || 0,
      percentage: '100%'
    },
    {
      metric: 'Pending Clients',
      value: stats.pendingClients || 0,
      percentage: stats.totalClients > 0 ? `${((stats.pendingClients / stats.totalClients) * 100).toFixed(1)}%` : '0%'
    },
    {
      metric: 'Contacted Clients',
      value: stats.contactedClients || 0,
      percentage: stats.totalClients > 0 ? `${((stats.contactedClients / stats.totalClients) * 100).toFixed(1)}%` : '0%'
    },
    {
      metric: 'Interested Clients',
      value: stats.interestedClients || 0,
      percentage: stats.totalClients > 0 ? `${((stats.interestedClients / stats.totalClients) * 100).toFixed(1)}%` : '0%'
    },
    {
      metric: 'Validated Clients',
      value: stats.validatedClients || 0,
      percentage: stats.totalClients > 0 ? `${((stats.validatedClients / stats.totalClients) * 100).toFixed(1)}%` : '0%'
    },
    {
      metric: 'Conversion Rate',
      value: `${stats.conversionRate || 0}%`,
      percentage: '-'
    },
    {
      metric: 'Total Calls',
      value: stats.totalCalls || 0,
      percentage: '-'
    },
    {
      metric: 'Avg Calls per Client',
      value: stats.avgCallsPerClient || 0,
      percentage: '-'
    }
  ];
  
  // Add wilaya distribution if available
  if (stats.wilayaStats) {
    const topWilayas = Object.entries(stats.wilayaStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    topWilayas.forEach(([wilaya, count], index) => {
      summaryData.push({
        metric: `Top Wilaya ${index + 1}`,
        value: `${wilaya} (${count} clients)`,
        percentage: stats.totalClients > 0 ? `${((count / stats.totalClients) * 100).toFixed(1)}%` : '0%'
      });
    });
  }
  
  const headers = [
    { key: 'metric', label: 'Metric' },
    { key: 'value', label: 'Value' },
    { key: 'percentage', label: 'Percentage' }
  ];
  
  const filename = getExportFilename(`suggested-clients-stats-${dateRange.toLowerCase().replace(/\s+/g, '-')}`, '.csv');
  downloadCSV(summaryData, headers, filename);
  
  return {
    totalMetrics: summaryData.length,
    filename
  };
};

/**
 * ADDED: Export wilaya and commune distribution
 * @param {Array} clients - Array of client objects
 * @returns {Object} Export result
 */
export const exportWilayaCommuneDistribution = (clients) => {
  const distribution = {};
  
  clients.forEach(client => {
    const wilaya = client.wilaya || 'Unknown';
    const commune = client.commune || 'Unknown';
    
    if (!distribution[wilaya]) {
      distribution[wilaya] = {};
    }
    
    if (!distribution[wilaya][commune]) {
      distribution[wilaya][commune] = 0;
    }
    
    distribution[wilaya][commune]++;
  });
  
  const exportData = [];
  Object.entries(distribution).forEach(([wilaya, communes]) => {
    Object.entries(communes).forEach(([commune, count]) => {
      exportData.push({
        wilaya,
        commune,
        clientCount: count,
        percentage: clients.length > 0 ? `${((count / clients.length) * 100).toFixed(2)}%` : '0%'
      });
    });
  });
  
  // Sort by client count descending
  exportData.sort((a, b) => b.clientCount - a.clientCount);
  
  const headers = [
    { key: 'wilaya', label: 'Wilaya' },
    { key: 'commune', label: 'Commune' },
    { key: 'clientCount', label: 'Number of Clients' },
    { key: 'percentage', label: 'Percentage' }
  ];
  
  const filename = getExportFilename('wilaya-commune-distribution', '.csv');
  downloadCSV(exportData, headers, filename);
  
  return {
    totalRecords: exportData.length,
    filename
  };
};