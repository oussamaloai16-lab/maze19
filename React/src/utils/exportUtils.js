// /**
//  * Utility functions for exporting data to CSV and Excel
//  */

// /**
//  * Convert array of objects to CSV string
//  * @param {Array} data - Array of objects to convert
//  * @param {Array} headers - Column headers for the CSV
//  * @returns {string} - CSV formatted string
//  */
// export const convertToCSV = (data, headers) => {
//   if (!data || !data.length) return '';

//   // Create header row
//   const headerRow = headers.map(header => header.label).join(',');
  
//   // Create data rows
//   const rows = data.map(item => {
//     return headers
//       .map(header => {
//         let value = header.key.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : ''), item);
        
//         // Handle values with commas by wrapping in quotes
//         if (value && value.toString().includes(',')) {
//           value = `"${value}"`;
//         }
        
//         return value !== undefined ? value : '';
//       })
//       .join(',');
//   });
  
//   // Combine header and data rows
//   return [headerRow, ...rows].join('\n');
// };

// /**
//  * Download data as a CSV file
//  * @param {Array} data - Array of objects to export
//  * @param {Array} headers - Column headers for the CSV
//  * @param {string} filename - Name of the file to download
//  */
// export const downloadCSV = (data, headers, filename = 'export.csv') => {
//   const csvContent = convertToCSV(data, headers);
  
//   // Create a Blob with the CSV data
//   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
//   // Create download link and trigger click
//   const link = document.createElement('a');
//   const url = URL.createObjectURL(blob);
  
//   link.setAttribute('href', url);
//   link.setAttribute('download', filename);
//   link.style.display = 'none';
  
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };

// /**
//  * Download data as an Excel file (XLSX format)
//  * Uses CSV as a fallback method when the xlsx library isn't available
//  * @param {Array} data - Array of objects to export
//  * @param {Array} headers - Column headers for the Excel
//  * @param {string} filename - Name of the file to download
//  */
// export const downloadExcel = (data, headers, filename = 'export.xlsx') => {
//   try {
//     // If using xlsx library (would need to be installed)
//     // import * as XLSX from 'xlsx';
//     // const worksheet = XLSX.utils.json_to_sheet(data);
//     // const workbook = XLSX.utils.book_new();
//     // XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
//     // XLSX.writeFile(workbook, filename);
    
//     // Since we might not have xlsx library, fallback to CSV
//     console.warn('Excel export library not available, falling back to CSV');
//     downloadCSV(data, headers, filename.replace('.xlsx', '.csv'));
//   } catch (error) {
//     console.error('Error exporting to Excel:', error);
//     // Fallback to CSV
//     downloadCSV(data, headers, filename.replace('.xlsx', '.csv'));
//   }
// };

// /**
//  * Prepare and format user data for export
//  * @param {Array} users - Array of user objects
//  * @returns {Array} - Cleaned array for export
//  */
// export const prepareUsersForExport = (users) => {
//   return users.map(user => ({
//     username: user.username || '',
//     email: user.email || '',
//     role: user.role?.replace(/_/g, ' ') || '',
//     status: user.active ? 'Active' : 'Inactive',
//     verified: user.isVerified ? 'Verified' : 'Unverified',
//     authProvider: user.authProvider || 'local',
//     createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
//   }));
// };

// /**
//  * Define headers for user export
//  */
// export const userExportHeaders = [
//   { key: 'username', label: 'Username' },
//   { key: 'email', label: 'Email' },
//   { key: 'role', label: 'Role' },
//   { key: 'status', label: 'Status' },
//   { key: 'verified', label: 'Verified' },
//   { key: 'authProvider', label: 'Auth Provider' },
//   { key: 'createdAt', label: 'Created At' }
// ];

/**
 * Utility functions for exporting data to CSV and Excel
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
        let value = header.key.split('.').reduce((obj, key) => 
          (obj && obj[key] !== undefined ? obj[key] : ''), item);
        
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
    // XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
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
 * Prepare and format user data for export
 * @param {Array} users - Array of user objects
 * @returns {Array} - Cleaned array for export
 */
export const prepareUsersForExport = (users) => {
  return users.map(user => ({
    username: user.username || '',
    email: user.email || '',
    role: user.role?.replace(/_/g, ' ') || '',
    status: user.active ? 'Active' : 'Inactive',
    verified: user.isVerified ? 'Verified' : 'Unverified',
    authProvider: user.authProvider || 'local',
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
  }));
};

/**
 * Define headers for user export
 */
export const userExportHeaders = [
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'verified', label: 'Verified' },
  { key: 'authProvider', label: 'Auth Provider' },
  { key: 'createdAt', label: 'Created At' }
];

/**
 * Prepare and format transaction data for export
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} - Cleaned array for export
 */
export const prepareTransactionsForExport = (transactions) => {
  return transactions.map(tx => ({
    transactionId: tx.transactionId || '',
    date: tx.date ? new Date(tx.date).toLocaleDateString() : '',
    service: tx.service || '',
    amount: typeof tx.amount === 'number' ? tx.amount.toFixed(2) : tx.amount || '',
    status: tx.status || '',
    paymentMethod: tx.paymentMethod || '',
    isInstallment: tx.isInstallment ? 'Yes' : 'No',
    clientId: tx.clientId || '',
    createdBy: tx.createdBy || '',
    notes: tx.notes || '',
    updatedAt: tx.updatedAt ? new Date(tx.updatedAt).toLocaleDateString() : ''
  }));
};

/**
 * Define headers for transaction export
 */
export const transactionExportHeaders = [
  { key: 'transactionId', label: 'Transaction ID' },
  { key: 'date', label: 'Date' },
  { key: 'service', label: 'Service' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'isInstallment', label: 'Installment' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'notes', label: 'Notes' },
  { key: 'updatedAt', label: 'Updated At' }
];