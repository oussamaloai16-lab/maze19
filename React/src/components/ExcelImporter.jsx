import React, { useState, useRef } from 'react';
import { 
  X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, 
  Info, Save, Download, Trash2, RefreshCw
} from 'lucide-react';
import TransactionService from '../services/transactionService';
import * as XLSX from 'xlsx';

const ExcelImporter = ({ isOpen, onClose, onSuccess, theme }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importStatus, setImportStatus] = useState('idle'); // idle, validating, importing, success, error
  const fileInputRef = useRef(null);

  // The expected columns in the Excel file
  const requiredColumns = [
    'transaction_id', 
    'date', 
    'service', 
    'client_id', 
    'amount', 
    'status', 
    'payment_method'
  ];

  // Reset the state when closing the modal
  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setError(null);
    setImportStatus('idle');
    onClose();
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setValidationErrors([]);
      setImportStatus('validating');
      validateExcelFile(selectedFile);
    }
  };

  // Trigger file input click
  const handleSelectFile = () => {
    fileInputRef.current.click();
  };

  // Generate template Excel file
  const handleDownloadTemplate = () => {
    // Create a template worksheet
    const template = [
      {
        transaction_id: "TRX-123456-7890",
        date: new Date().toISOString().split('T')[0],
        service: "Web Development",
        client_id: "client_id_here",
        amount: 1000,
        status: "pending",
        payment_method: "cash",
        payment_type: "in",
        notes: "Example transaction note",
        is_installment: false
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Add column descriptions as a second sheet
    const descriptions = [
      { column: 'transaction_id', description: 'Unique ID for the transaction (required)', format: 'Text, unique identifier' },
      { column: 'date', description: 'Transaction date (required)', format: 'YYYY-MM-DD format' },
      { column: 'service', description: 'Service provided (required)', format: 'Text (Graphic Design, Web Development, etc.)' },
      { column: 'client_id', description: 'Client ID (required)', format: 'Must match a valid client ID in the system' },
      { column: 'amount', description: 'Transaction amount (required)', format: 'Numeric value, positive for income, negative for expense' },
      { column: 'status', description: 'Transaction status', format: 'pending, processing, completed, failed, refunded, cancelled' },
      { column: 'payment_method', description: 'Method of payment', format: 'cash, bank_transfer, credit_card, cheque, check, paypal, other' },
      { column: 'payment_type', description: 'Type of payment', format: 'in (income) or out (expense)' },
      { column: 'notes', description: 'Additional transaction notes', format: 'Text (optional)' },
      { column: 'is_installment', description: 'Whether this is an installment payment', format: 'true or false (optional)' }
    ];

    const descWs = XLSX.utils.json_to_sheet(descriptions);
    XLSX.utils.book_append_sheet(wb, descWs, "Column Guide");

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `transaction_import_template_${date}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  // Validate the Excel file format and data
  const validateExcelFile = (excelFile) => {
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true
        });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        
        if (jsonData.length === 0) {
          setError('The Excel file is empty.');
          setImportStatus('error');
          setLoading(false);
          return;
        }
        
        // Validate the columns and data
        const errors = [];
        const firstRow = jsonData[0];
        const columnHeaders = Object.keys(firstRow).map(key => key.toLowerCase().trim());
        
        // Check for required columns
        requiredColumns.forEach(col => {
          const normalizedCol = col.toLowerCase().trim();
          if (!columnHeaders.some(header => header === normalizedCol)) {
            errors.push(`Required column '${col}' is missing.`);
          }
        });
        
        // Validate data types for each row
        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // +2 because of 0-indexing and header row
          
          // Check if transaction_id is provided
          if (!row.transaction_id) {
            errors.push(`Row ${rowNum}: Transaction ID is required.`);
          }
          
          // Check if amount is a number
          if (row.amount !== null && row.amount !== undefined) {
            const amount = parseFloat(row.amount);
            if (isNaN(amount)) {
              errors.push(`Row ${rowNum}: Amount must be a number.`);
            }
          } else {
            errors.push(`Row ${rowNum}: Amount is required.`);
          }
          
          // Check if date is valid
          if (!row.date) {
            errors.push(`Row ${rowNum}: Date is required.`);
          } else {
            // If date is not a Date object, try to parse it
            if (!(row.date instanceof Date)) {
              const dateValue = new Date(row.date);
              if (isNaN(dateValue.getTime())) {
                errors.push(`Row ${rowNum}: Invalid date format.`);
              }
            }
          }
          
          // Check if client_id is provided
          if (!row.client_id) {
            errors.push(`Row ${rowNum}: Client ID is required.`);
          }
          
          // Check if service is provided
          if (!row.service) {
            errors.push(`Row ${rowNum}: Service is required.`);
          }
          
          // Validate status if provided
          if (row.status) {
            const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'];
            if (!validStatuses.includes(row.status.toLowerCase())) {
              errors.push(`Row ${rowNum}: Invalid status '${row.status}'. Valid values are: ${validStatuses.join(', ')}.`);
            }
          }
          
          // Validate payment_method if provided
          if (row.payment_method) {
            const validPaymentMethods = ['cash', 'bank_transfer', 'credit_card', 'cheque', 'check', 'paypal', 'other'];
            if (!validPaymentMethods.includes(row.payment_method.toLowerCase())) {
              errors.push(`Row ${rowNum}: Invalid payment method '${row.payment_method}'. Valid values are: ${validPaymentMethods.join(', ')}.`);
            }
          }
        });
        
        // Store validation errors and preview data
        setValidationErrors(errors);
        setPreviewData(jsonData.slice(0, 5)); // Show first 5 rows as preview
        
        if (errors.length > 0) {
          setImportStatus('error');
        } else {
          setImportStatus('validated');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error reading Excel file:', err);
        setError('Failed to read the Excel file. Please make sure it is a valid Excel file.');
        setImportStatus('error');
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
      setImportStatus('error');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(excelFile);
  };

  // Process and import the transactions
  const handleImportTransactions = async () => {
    if (importStatus !== 'validated' || !file) {
      return;
    }
    
    setImportStatus('importing');
    setLoading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true
          });
          
          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          let transactions = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });
          
          // Transform the data to match our API schema
          transactions = transactions.map(row => {
            // Determine if this is an income or expense based on either the amount sign or payment_type field
            let amount = parseFloat(row.amount);
            if (row.payment_type && row.payment_type.toLowerCase() === 'out') {
              amount = -Math.abs(amount); // Ensure negative for expenses
            } else if (row.payment_type && row.payment_type.toLowerCase() === 'in') {
              amount = Math.abs(amount); // Ensure positive for income
            }
            
            return {
              transactionId: row.transaction_id,
              date: row.date,
              service: row.service,
              clientId: row.client_id,
              amount: amount,
              status: (row.status || 'pending').toLowerCase(),
              paymentMethod: (row.payment_method || 'cash').toLowerCase(),
              isInstallment: row.is_installment === true || row.is_installment === 'true',
              notes: row.notes || ''
            };
          });
          
          // Call the API to import transactions
          const result = await TransactionService.importTransactions(transactions);
          
          console.log('Import result:', result);
          setImportStatus('success');
          setLoading(false);
          
          // Call onSuccess callback to refresh the transaction list
          if (typeof onSuccess === 'function') {
            onSuccess(result);
          }
          
          // Automatically close after 2 seconds on success
          setTimeout(() => {
            handleClose();
          }, 2000);
        } catch (err) {
          console.error('Error importing transactions:', err);
          setError('Failed to import transactions. ' + (err.message || 'Please try again.'));
          setImportStatus('error');
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read the file. Please try again.');
        setImportStatus('error');
        setLoading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error in import process:', err);
      setError('An unexpected error occurred. Please try again.');
      setImportStatus('error');
      setLoading(false);
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold flex items-center">
            <FileSpreadsheet size={24} className="mr-2" />
            Import Transactions from Excel
          </h2>
          <button
            onClick={handleClose}
            className={`rounded-full p-1 hover:bg-opacity-20 ${
              theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className={`mb-6 p-4 rounded-lg flex items-start ${
              theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
            }`}>
              <AlertTriangle size={20} className="mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <div className={`mb-6 p-6 border-2 border-dashed rounded-lg text-center ${
            theme === 'dark' 
              ? 'border-gray-700 bg-gray-800' 
              : 'border-gray-300 bg-gray-50'
          } ${file ? 'border-blue-500' : ''}`}>
            {!file ? (
              <>
                <FileSpreadsheet size={48} className={`mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <p className="mb-4 font-medium">
                  Drag and drop your Excel file here, or click to select
                </p>
                <button
                  onClick={handleSelectFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <Upload size={18} className="mr-2" />
                  Select Excel File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <p className="mt-4 text-sm text-gray-500">
                  Only Excel files (.xlsx, .xls) are supported
                </p>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-center mb-4">
                  <FileSpreadsheet size={32} className="mr-3 text-blue-500" />
                  <span className="font-medium truncate max-w-md">{file.name}</span>
                </div>
                
                {importStatus === 'validating' && (
                  <div className="flex justify-center items-center">
                    <RefreshCw size={24} className="animate-spin mr-2 text-blue-500" />
                    <span>Validating file...</span>
                  </div>
                )}
                
                {importStatus === 'importing' && (
                  <div className="flex justify-center items-center">
                    <RefreshCw size={24} className="animate-spin mr-2 text-blue-500" />
                    <span>Importing transactions...</span>
                  </div>
                )}
                
                {importStatus === 'validated' && (
                  <div className="flex justify-center items-center text-green-500">
                    <CheckCircle size={24} className="mr-2" />
                    <span>File validated successfully</span>
                  </div>
                )}
                
                {importStatus === 'error' && validationErrors.length > 0 && (
                  <div className="flex justify-center items-center text-red-500">
                    <AlertTriangle size={24} className="mr-2" />
                    <span>Validation failed</span>
                  </div>
                )}
                
                {importStatus === 'success' && (
                  <div className="flex justify-center items-center text-green-500">
                    <CheckCircle size={24} className="mr-2" />
                    <span>Import completed successfully!</span>
                  </div>
                )}
                
                <div className="mt-4 flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setFile(null);
                      setImportStatus('idle');
                      setValidationErrors([]);
                      setPreviewData([]);
                    }}
                    className={`px-3 py-1.5 rounded flex items-center ${
                      theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <Trash2 size={16} className="mr-1" />
                    Remove
                  </button>
                  
                  <button
                    onClick={handleSelectFile}
                    className={`px-3 py-1.5 rounded flex items-center ${
                      theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <Upload size={16} className="mr-1" />
                    Select Different File
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Template Download Section */}
          <div className={`mb-6 p-4 rounded-lg flex items-start ${
            theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'
          }`}>
            <Info size={20} className="mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Need a template?</p>
              <p className="mb-2">Download our Excel template with the correct format for importing transactions.</p>
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700"
              >
                <Download size={16} className="mr-1" />
                Download Template
              </button>
            </div>
          </div>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className={`mb-6 p-4 rounded-lg ${
              theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center mb-2">
                <AlertTriangle size={18} className="mr-2" />
                <h3 className="font-medium">Validation Errors ({validationErrors.length})</h3>
              </div>
              <div className={`max-h-40 overflow-y-auto p-2 rounded ${
                theme === 'dark' ? 'bg-red-900/20' : 'bg-red-100'
              }`}>
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-sm">Please fix these errors in your Excel file and try again.</p>
            </div>
          )}
          
          {/* Data Preview */}
          {previewData.length > 0 && (
            <div className="mb-6">
              <h3 className={`font-medium mb-2 flex items-center ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Info size={18} className="mr-2" />
                Data Preview (First {previewData.length} rows)
              </h3>
              <div className="overflow-x-auto">
                <table className={`min-w-full border ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                      {Object.keys(previewData[0]).map((key) => (
                        <th key={key} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider border-r border-b border-gray-300">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {previewData.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 
                        ? (theme === 'dark' ? 'bg-gray-800' : 'bg-white') 
                        : (theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50')
                      }>
                        {Object.entries(row).map(([key, value], cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}`} className={`px-4 py-2 text-sm border-r ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            {value !== null && value !== undefined ? String(value) : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`flex justify-end gap-2 p-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            type="button"
            onClick={handleClose}
            className={`px-4 py-2 rounded font-medium ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleImportTransactions}
            disabled={importStatus !== 'validated' || loading}
            className={`px-4 py-2 rounded font-medium flex items-center ${
              importStatus !== 'validated' || loading
                ? (theme === 'dark' ? 'bg-blue-800/50 text-blue-300/50' : 'bg-blue-300 text-white')
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Import Transactions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelImporter;