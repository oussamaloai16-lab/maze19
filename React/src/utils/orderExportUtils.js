/**
 * Utility functions for exporting order data to CSV and Excel
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Column headers for the CSV
 * @returns {string} - CSV formatted string
 */
export const convertToCSV = (data, headers) => {
    if (!data || !data.length) return '';
  
    // Create header row
    const headerRow = headers.map(header => header.label).join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return headers
        .map(header => {
          let value = header.key.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : ''), item);
          
          // Handle values with commas by wrapping in quotes
          if (value && value.toString().includes(',')) {
            value = `"${value}"`;
          }
          
          return value !== undefined ? value : '';
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
  export const downloadCSV = (data, headers, filename = 'export.csv') => {
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
   * Uses CSV as a fallback method when the xlsx library isn't available
   * @param {Array} data - Array of objects to export
   * @param {Array} headers - Column headers for the Excel
   * @param {string} filename - Name of the file to download
   */
  export const downloadExcel = (data, headers, filename = 'export.xlsx') => {
    try {
      // If using xlsx library (would need to be installed)
      // import * as XLSX from 'xlsx';
      // const worksheet = XLSX.utils.json_to_sheet(data);
      // const workbook = XLSX.utils.book_new();
      // XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      // XLSX.writeFile(workbook, filename);
      
      // Since we might not have xlsx library, fallback to CSV
      console.warn('Excel export library not available, falling back to CSV');
      downloadCSV(data, headers, filename.replace('.xlsx', '.csv'));
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      // Fallback to CSV
      downloadCSV(data, headers, filename.replace('.xlsx', '.csv'));
    }
  };
  
  /**
   * Prepare and format order data for export
   * @param {Array} orders - Array of order objects
   * @returns {Array} - Cleaned array for export
   */
  export const prepareOrdersForExport = (orders) => {
    return orders.map(order => ({
      orderId: order._id || '',
      customerName: order.customerName || '',
      date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
      status: order.status || '',
      total: order.deliveryFees?.toFixed(2) || '0.00',
      trackingId: order.trackingId || 'N/A',
      deliveryType: order.deliveryType || '',
      wilaya: order.wilaya || '',
      commune: order.commune || '',
      address: order.address || '',
      mobile1: order.mobile1 || '',
      mobile2: order.mobile2 || '',
      orderType: order.orderType || '',
      returnFees: order.returnFees?.toFixed(2) || '0.00',
      productDetails: order.productDetails || '',
      note: order.note || '',
      zrexpressSynced: order.zrexpressSynced ? 'Yes' : 'No',
    }));
  };
  
  /**
   * Define headers for order export
   */
  export const orderExportHeaders = [
    { key: 'orderId', label: 'Order ID' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total' },
    { key: 'trackingId', label: 'Tracking ID' },
    { key: 'deliveryType', label: 'Delivery Type' },
    { key: 'wilaya', label: 'Wilaya' },
    { key: 'commune', label: 'Commune' },
    { key: 'address', label: 'Address' },
    { key: 'mobile1', label: 'Primary Mobile' },
    { key: 'mobile2', label: 'Secondary Mobile' },
    { key: 'orderType', label: 'Order Type' },
    { key: 'returnFees', label: 'Return Fees' },
    { key: 'productDetails', label: 'Product Details' },
    { key: 'note', label: 'Note' },
    { key: 'zrexpressSynced', label: 'ZRexpress Synced' }
  ];