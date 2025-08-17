/**
 * Utility functions for exporting transaction data to CSV and Excel
 */

/**
 * Define headers for transaction export
 */
export const transactionExportHeaders = [
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'date', label: 'Date' },
    { key: 'service', label: 'Service' },
    { key: 'amount', label: 'Amount' },
    { key: 'clientName', label: 'Client' },
    { key: 'status', label: 'Status' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'isInstallment', label: 'Installment' },
    { key: 'notes', label: 'Notes' },
    { key: 'createdBy', label: 'Created By' }
  ];
  
  /**
   * Prepare and format transaction data for export
   * @param {Array} transactions - Array of transaction objects
   * @returns {Array} - Cleaned array for export
   */
  export const prepareTransactionsForExport = (transactions) => {
    return transactions.map(transaction => ({
      transactionId: transaction.transactionId || '',
      date: transaction.date ? new Date(transaction.date).toLocaleDateString() : '',
      service: transaction.service || '',
      amount: typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00',
      clientName: transaction.clientName || '',
      status: transaction.status || '',
      paymentMethod: transaction.paymentMethod || '',
      isInstallment: transaction.isInstallment ? 'Yes' : 'No',
      notes: transaction.notes || '',
      createdBy: transaction.createdBy || ''
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
  export const downloadCSV = (data, headers, filename = 'transactions.csv') => {
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
  };
  
  /**
   * Download data as an Excel file (XLSX format)
   * Uses CSV as a fallback method since we're not using the xlsx library
   * @param {Array} data - Array of objects to export
   * @param {Array} headers - Column headers for the Excel
   * @param {string} filename - Name of the file to download
   */
  export const downloadExcel = (data, headers, filename = 'transactions.xlsx') => {
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
   * Format currency with locale
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  export const formatCurrency = (amount) => {
    const formatter = new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2
    });
    return formatter.format(amount);
  };
  
  /**
   * Format amount for display with colored text
   * @param {number} amount - Amount to format
   * @param {string} theme - Current theme ('dark' or 'light')
   * @returns {Object} - Object with formatted amount, color, and prefix
   */
  export const formatAmountWithColor = (amount, theme) => {
    const isPositive = amount >= 0;
    const formattedAmount = formatCurrency(Math.abs(amount));
    const color = isPositive 
      ? (theme === 'dark' ? '#10B981' : 'green') 
      : (theme === 'dark' ? '#EF4444' : 'red');
  
    return {
      formattedAmount,
      color,
      prefix: isPositive ? '+' : '-'
    };
  };