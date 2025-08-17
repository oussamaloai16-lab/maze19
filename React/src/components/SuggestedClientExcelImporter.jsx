import React, { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import SuggestedClientService from '../services/suggestedClientService';
import * as XLSX from 'xlsx';
import { 
  Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, 
  Download, RefreshCw, Eye, Trash2, Plus, Users, MapPin
} from 'lucide-react';

const SuggestedClientExcelImporter = ({ isOpen, onClose, onSuccess, theme }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [importStatus, setImportStatus] = useState('idle');
  const [wilayaOptions, setWilayaOptions] = useState([]);
  const [communeOptions, setCommuneOptions] = useState([]);
  const fileInputRef = React.useRef(null);

  // Load wilayas from API
  React.useEffect(() => {
    const fetchWilayas = async () => {
      try {
        const response = await SuggestedClientService.getUniqueWilayas();
        setWilayaOptions(response.data || []);
      } catch (error) {
        console.error('Error fetching wilayas:', error);
        setWilayaOptions([]);
      }
    };

    if (isOpen) {
      fetchWilayas();
    }
  }, [isOpen]);

  // The expected columns in the Excel file
  const requiredColumns = [
    'store_name', 
    'store_address', 
    'wilaya',
    'commune', // ADDED: commune is now required
    'phone_number'
  ];

  // Helper function to get communes for a wilaya (simplified for now)
  const getCommunesForWilaya = (wilayaName) => {
    // For now, return empty array - you can enhance this later
    return [];
  };

  // Helper function to validate if commune belongs to wilaya (simplified for now)
  const isValidCommuneForWilaya = (commune, wilaya) => {
    // For now, always return true - you can enhance this later
    return true;
  };

  const priorityOptions = ['low', 'medium', 'high', 'urgent'];

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
        store_name: "Example Store",
        store_address: "123 Main Street, City Center",
        wilaya: "Alger",
        commune: "Alger Centre",
        phone_number: "0555123456",
        social_media_link: "https://facebook.com/examplestore",
        business_type: "Retail Store",
        estimated_budget: 50000,
        score: 42,
        priority: "medium",
        tags: "fashion, boutique",
        notes: "Example notes about the client"
      }
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    // Add column descriptions as a second sheet
    const descriptions = [
      { column: 'store_name', description: 'Name of the store (required)', format: 'Text' },
      { column: 'store_address', description: 'Complete store address (required)', format: 'Text' },
      { column: 'wilaya', description: 'Algerian wilaya (required)', format: 'Must match one of the 48 wilayas' },
      { column: 'commune', description: 'Commune within the wilaya (required)', format: 'Must be a valid commune for the specified wilaya' },
      { column: 'phone_number', description: 'Phone number (required)', format: 'Text (0XXXXXXXXX format)' },
      { column: 'social_media_link', description: 'Social media URL (optional)', format: 'Valid URL starting with http:// or https://' },
      { column: 'business_type', description: 'Type of business (optional)', format: 'Any text describing the business type' },
      { column: 'estimated_budget', description: 'Estimated budget in DA (optional)', format: 'Numeric value' },
      { column: 'score', description: 'Client score (optional)', format: 'Numeric value (0 or higher)' },
      { column: 'priority', description: 'Client priority (optional)', format: 'low, medium, high, urgent' },
      { column: 'tags', description: 'Tags separated by commas (optional)', format: 'Text, comma-separated' },
      { column: 'notes', description: 'Additional notes (optional)', format: 'Text' }
    ];

    const descWs = XLSX.utils.json_to_sheet(descriptions);
    XLSX.utils.book_append_sheet(wb, descWs, "Column Guide");

    // Add wilayas reference sheet (simplified for now)
    const wilayasRef = wilayaOptions.map(wilaya => ({
      wilaya: wilaya,
      commune: 'Contact admin for communes'
    }));
    const refWs = XLSX.utils.json_to_sheet(wilayasRef);
    XLSX.utils.book_append_sheet(wb, refWs, "Wilayas Reference");

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `suggested_clients_import_template_${date}.xlsx`;

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
          
          // Check if store_name is provided
          if (!row.store_name || !row.store_name.toString().trim()) {
            errors.push(`Row ${rowNum}: Store name is required.`);
          }
          
          // Check if store_address is provided
          if (!row.store_address || !row.store_address.toString().trim()) {
            errors.push(`Row ${rowNum}: Store address is required.`);
          }
          
          // Check if wilaya is valid
          if (!row.wilaya || !row.wilaya.toString().trim()) {
            errors.push(`Row ${rowNum}: Wilaya is required.`);
          } else if (!wilayaOptions.includes(row.wilaya.toString().trim())) {
            errors.push(`Row ${rowNum}: Invalid wilaya '${row.wilaya}'. Must be one of the 48 Algerian wilayas.`);
          }
          
          // ADDED: Check if commune is valid and belongs to the wilaya
          if (!row.commune || !row.commune.toString().trim()) {
            errors.push(`Row ${rowNum}: Commune is required.`);
          } else if (row.wilaya && row.wilaya.toString().trim()) {
            const wilaya = row.wilaya.toString().trim();
            const commune = row.commune.toString().trim();
            if (!isValidCommuneForWilaya(commune, wilaya)) {
              errors.push(`Row ${rowNum}: Invalid commune '${commune}' for wilaya '${wilaya}'.`);
            }
          }
          
          // Check if phone_number is provided
          if (!row.phone_number || !row.phone_number.toString().trim()) {
            errors.push(`Row ${rowNum}: Phone number is required.`);
          } else {
            // Basic phone number validation
            const phoneRegex = /^[0-9+\-\s()]+$/;
            if (!phoneRegex.test(row.phone_number.toString())) {
              errors.push(`Row ${rowNum}: Invalid phone number format.`);
            }
          }
          
          // Validate social_media_link if provided
          if (row.social_media_link && row.social_media_link.toString().trim()) {
            try {
              new URL(row.social_media_link.toString());
            } catch {
              errors.push(`Row ${rowNum}: Invalid social media URL format.`);
            }
          }
          
          // UPDATED: Business type validation removed - now accepts any string
          // No validation needed for business_type as it's now unrestricted
          
          // Validate estimated_budget if provided
          if (row.estimated_budget !== null && row.estimated_budget !== undefined && row.estimated_budget !== '') {
            const budget = parseFloat(row.estimated_budget);
            if (isNaN(budget) || budget < 0) {
              errors.push(`Row ${rowNum}: Estimated budget must be a positive number.`);
            }
          }
          
          // Validate score if provided
          if (row.score !== null && row.score !== undefined && row.score !== '') {
            const score = parseFloat(row.score);
            if (isNaN(score) || score < 0) {
              errors.push(`Row ${rowNum}: Score must be a positive number or zero.`);
            }
          }
          
          // Validate priority if provided
          if (row.priority && !priorityOptions.includes(row.priority.toString().toLowerCase().trim())) {
            errors.push(`Row ${rowNum}: Invalid priority '${row.priority}'. Valid values are: ${priorityOptions.join(', ')}.`);
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

  // Process and import the suggested clients
  const handleImportClients = async () => {
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
          let clients = XLSX.utils.sheet_to_json(worksheet, {
            raw: false
          });
          
          // Transform the data to match our API schema
          clients = clients.map(row => {
            const clientData = {
              storeName: row.store_name ? row.store_name.toString().trim() : '',
              storeAddress: row.store_address ? row.store_address.toString().trim() : '',
              wilaya: row.wilaya ? row.wilaya.toString().trim() : '',
              commune: row.commune ? row.commune.toString().trim() : '', // ADDED: commune field
              phoneNumber: row.phone_number ? row.phone_number.toString().trim() : '',
              socialMediaLink: row.social_media_link ? row.social_media_link.toString().trim() : '',
              businessType: row.business_type ? row.business_type.toString().trim() : 'Other', // UPDATED: accepts any string
              priority: row.priority ? row.priority.toString().toLowerCase().trim() : 'medium',
              notes: row.notes ? row.notes.toString().trim() : ''
            };

            // Handle estimated budget
            if (row.estimated_budget !== null && row.estimated_budget !== undefined && row.estimated_budget !== '') {
              const budget = parseFloat(row.estimated_budget);
              if (!isNaN(budget) && budget >= 0) {
                clientData.estimatedBudget = budget;
              }
            }

            // Handle score
            if (row.score !== null && row.score !== undefined && row.score !== '') {
              const score = parseFloat(row.score);
              if (!isNaN(score) && score >= 0) {
                clientData.score = score;
              }
            } else {
              clientData.score = 0; // Default score to 0 if not provided
            }

            // Handle tags
            if (row.tags && row.tags.toString().trim()) {
              clientData.tags = row.tags.toString().split(',').map(tag => tag.trim()).filter(tag => tag);
            }

            return clientData;
          });
          
          // Call the API to import clients
          const result = await SuggestedClientService.importSuggestedClients(clients);
          
          console.log('Import result:', result);
          setImportStatus('success');
          setLoading(false);
          
          // Call onSuccess callback to refresh the client list
          if (typeof onSuccess === 'function') {
            onSuccess(result);
          }
          
          // Automatically close after 2 seconds on success
          setTimeout(() => {
            handleClose();
          }, 2000);
        } catch (err) {
          console.error('Error importing suggested clients:', err);
          setError('Failed to import suggested clients. ' + (err.message || 'Please try again.'));
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
            Import Suggested Clients from Excel
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
                    <span>Importing suggested clients...</span>
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
              <p className="mb-2">Download our Excel template with the correct format for importing suggested clients. Includes wilayas and communes reference.</p>
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
            onClick={handleImportClients}
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
                Import Suggested Clients
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestedClientExcelImporter;