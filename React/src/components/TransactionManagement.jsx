import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import TransactionService from '../services/transactionService';
import UserService from '../services/userService';
import AddTransactionPopup from '../components/AddTransactionPopup';
import ExcelImporter from '../components/ExcelImporter';
import { 
  PlusCircle, Pencil, Trash2, Search, ArrowUpDown, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Download, MoreHorizontal,
  Filter, FileSpreadsheet, FileText, DollarSign, Printer,
  ArrowDownLeft, ArrowUpRight, Upload, Trash, Check, X, ChevronDown
} from 'lucide-react';
import { 
  downloadCSV, 
  downloadExcel, 
  prepareTransactionsForExport, 
  transactionExportHeaders 
} from '../utils/exportUtils';

const TransactionManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isExcelImporterOpen, setIsExcelImporterOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    service: '',
    startDate: '',
    endDate: '',
    isInstallment: null
  });
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25); // Increased to show 25 items per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const exportMenuRef = useRef(null);
  
  // New state to track which transaction has dropdown open
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  // Reference to detect clicks outside of dropdown
  const statusDropdownRef = useRef(null);
  
  // User data state for client names and created by info
  const [usersMap, setUsersMap] = useState({});
  
  // Statistics
  const [stats, setStats] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalAmount: 0
  });

  // Handle status update for a transaction
  const handleStatusUpdate = async (transactionId, newStatus) => {
    try {
      setLoading(true);
      // Call your API to update the transaction status
      await TransactionService.updateTransactionStatus(transactionId, newStatus);
      
      // Update the transaction in the local state
      setTransactions(prevTransactions => 
        prevTransactions.map(tx => 
          tx._id === transactionId || tx.transactionId === transactionId 
            ? { ...tx, status: newStatus } 
            : tx
        )
      );

      // Close the dropdown
      setOpenStatusDropdown(null);
      
      // Show success message
      setError(null);
      
      // Refetch transactions to update stats
      fetchTransactions();
    } catch (err) {
      console.error('Error updating transaction status:', err);
      setError(`Failed to update transaction status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllTransactions = async () => {
    try {
      const response = await TransactionService.deleteAllTransactions();
      fetchTransactions();
      setError(null);
    } catch (err) {
      console.error('Error deleting all transactions:', err);
      setError('Failed to delete all transactions. Please try again.');
    }
  };
  
  // Add this confirmation dialog component
  const DeleteAllConfirmationDialog = () => {
    if (!showDeleteAllConfirmation) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} max-w-md`}>
          <h3 className="text-xl font-bold mb-4">Delete All Transactions</h3>
          <p className="mb-6">Are you sure you want to delete all transactions? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setShowDeleteAllConfirmation(false)}
              className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                handleDeleteAllTransactions();
                setShowDeleteAllConfirmation(false);
              }}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete All
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Fetch users data to map IDs to names
  const fetchUsers = async () => {
    try {
      const response = await UserService.getAllUsers();
      
      // Create a map of user IDs to user names
      const userMap = {};
      const users = response?.data || response || [];
      
      if (Array.isArray(users)) {
        users.forEach(user => {
          userMap[user._id] = user.username || user.name || user.email || 'Unknown User';
        });
      }
      
      setUsersMap(userMap);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Continue without user data
    }
  };
  
  // Set date range filters
  useEffect(() => {
    const today = new Date();
    let startDate = null;
    
    if (dateRange === 'Last 30 days') {
      startDate = new Date();
      startDate.setDate(today.getDate() - 30);
    } else if (dateRange === 'Last 90 days') {
      startDate = new Date();
      startDate.setDate(today.getDate() - 90);
    } else if (dateRange === 'This month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (dateRange === 'Last month') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      setFilters(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }));
      return;
    } else if (dateRange === 'This year') {
      startDate = new Date(today.getFullYear(), 0, 1);
    } else if (dateRange === 'All time') {
      // Remove date filters
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: ''
      }));
      return;
    }
    
    if (startDate) {
      setFilters(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }));
    }
  }, [dateRange]);
  
  // Fetch transactions with the updated API response format
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Capture current filter state to ensure we use the latest values
      const currentFilters = { ...filters };
      console.log('Fetching transactions with filters:', currentFilters);
  
      const currentLimit = limit || 25;
      
      const response = await TransactionService.getAllTransactions(page, currentLimit, currentFilters);
      console.log('Received transactions data:', response);
      
      if (response && response.transactions) {
        // Rest of your function remains the same
        const enrichedTransactions = response.transactions.map(tx => {
          return {
            ...tx,
            clientName: tx.clientName || usersMap[tx.clientId] || 'N/A',
            creatorName: tx.creatorName || usersMap[tx.createdBy] || 'N/A',
            paymentType: tx.paymentType || (tx.amount >= 0 ? 'in' : 'out')
          };
        });
        
        setTransactions(enrichedTransactions);
        console.log(`Updated transactions array with ${enrichedTransactions.length} items`);
        
        // Set pagination data
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalItems(response.pagination.totalItems || 0);
          console.log('Updated pagination:', response.pagination);
        }
        
        // Set statistics data
        if (response.stats) {
          setStats(response.stats);
          console.log('Updated stats:', response.stats);
        } else {
          // Calculate basic stats if not provided by the API
          const calculatedStats = calculateStats(enrichedTransactions);
          setStats(calculatedStats);
          console.log('Calculated stats locally:', calculatedStats);
        }
        
        setError(null);
      } else {
        console.error('Invalid response format:', response);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
      // Keep the existing transactions rather than clearing them on error
    } finally {
      setLoading(false);
    }
  };

  // Handle client-side filtering based on tab and search
  const getFilteredTransactions = () => {
    // First apply status filtering based on activeTab
    let statusFiltered = transactions;
    
    if (activeTab === 'Pending') {
      statusFiltered = transactions.filter(tx => tx.status === 'pending');
    } else if (activeTab === 'Completed') {
      statusFiltered = transactions.filter(tx => tx.status === 'completed');
    } else if (activeTab === 'Failed') {
      statusFiltered = transactions.filter(tx => 
        tx.status === 'failed' || tx.status === 'cancelled'
      );
    }
    
    // Then apply search term filtering if needed
    if (!searchTerm) return statusFiltered;
    
    // Search filtering works on the already status-filtered transactions
    return statusFiltered.filter(tx => 
      tx.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.creatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.clientId?.toString().includes(searchTerm) ||
      tx.createdBy?.toString().includes(searchTerm)
    );
  };

  // Calculate statistics if not provided by the API
  const calculateStats = (transactionsList) => {
    if (!transactionsList || !Array.isArray(transactionsList)) {
      return {
        totalTransactions: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0,
        totalAmount: 0
      };
    }
    
    // Filter transactions by status
    const completed = transactionsList.filter(tx => tx.status === 'completed');
    const pending = transactionsList.filter(tx => tx.status === 'pending');
    const failed = transactionsList.filter(tx => 
      tx.status === 'failed' || tx.status === 'cancelled'
    );
    
    // Calculate total amount
    let totalAmount = 0;
    
    transactionsList.forEach(tx => {
      let parsedAmount = 0;
      
      if (typeof tx.amount === 'number') {
        parsedAmount = tx.amount;
      } else if (typeof tx.amount === 'string') {
        // Remove currency symbols and non-numeric chars except decimal point
        const cleaned = tx.amount.replace(/[^\d.-]/g, '');
        parsedAmount = parseFloat(cleaned);
      }
      
      if (!isNaN(parsedAmount)) {
        totalAmount += parsedAmount;
      }
    });
    
    return {
      totalTransactions: transactionsList.length,
      completedTransactions: completed.length,
      pendingTransactions: pending.length,
      failedTransactions: failed.length,
      totalAmount: totalAmount
    };
  };

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch transactions whenever dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [page, limit, filters.startDate, filters.endDate, filters.service]);
  
  // Secondary effect to apply user mapping after user data is fetched
  useEffect(() => {
    if (Object.keys(usersMap).length > 0 && transactions.length > 0) {
      // Only update if we actually have user data to apply
      const enrichedTransactions = transactions.map(tx => {
        if (!tx.clientName && tx.clientId && usersMap[tx.clientId]) {
          return {
            ...tx,
            clientName: usersMap[tx.clientId]
          };
        }
        
        if (!tx.creatorName && tx.createdBy && usersMap[tx.createdBy]) {
          return {
            ...tx,
            creatorName: usersMap[tx.createdBy]
          };
        }
        
        return tx;
      });
      
      // Only update if something changed
      if (JSON.stringify(enrichedTransactions) !== JSON.stringify(transactions)) {
        setTransactions(enrichedTransactions);
      }
    }
  }, [usersMap, transactions]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportMenuRef]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setOpenStatusDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusDropdownRef]);

  // Handle tab change - simplified for frontend filtering
  const handleTabChange = (tab) => {
    console.log(`Tab changed to: ${tab}`);
    setActiveTab(tab);
    // We don't need to change filters anymore, as we're filtering in getFilteredTransactions
  };

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    // The date filters will be set in the useEffect
    
    // Reset to first page
    setPage(1);
  };

  const handleAddTransaction = () => {
    setCurrentTransaction(null);
    setIsAddTransactionOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setCurrentTransaction(transaction);
    setIsAddTransactionOpen(true);
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await TransactionService.deleteTransaction(transactionId);
        fetchTransactions();
      } catch (err) {
        setError(`Failed to delete transaction: ${err.message}`);
      }
    }
  };

  const handleAddTransactionSuccess = () => {
    fetchTransactions();
  };

  const handleImportSuccess = () => {
    fetchTransactions();
  };

  const handleOpenExcelImporter = () => {
    setIsExcelImporterOpen(true);
  };
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };
  
  // Format amount to match the DZ locale format (10 000,00 DA)
  const formatDisplayAmount = (amount) => {
    if (amount === undefined || amount === null) return '0,00 DA';
    
    let numericAmount = amount;
    if (typeof amount === 'string') {
      // Remove any non-numeric characters except decimal separator
      numericAmount = parseFloat(amount.replace(/[^\d.-]/g, '').replace(',', '.'));
    }
    
    if (isNaN(numericAmount)) return '0,00 DA';
    
    // Format like "10 000,00 DA" or "-10 000,00 DA" preserving the sign
    const prefix = numericAmount < 0 ? '-' : '';
    return prefix + Math.abs(numericAmount).toLocaleString('fr-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('.', ',') + ' DA';
  };

  // Function to format user IDs for display
  const formatUserId = (userId) => {
    if (!userId) return 'N/A';
    return userId;
  };

  const handleExportToCSV = () => {
    try {
      const exportData = prepareTransactionsForExport(filteredTransactions);
      const date = new Date().toISOString().split('T')[0];
      const filename = `transactions_export_${date}.csv`;
      downloadCSV(exportData, transactionExportHeaders, filename);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export transactions to CSV.');
    }
  };

  const handleExportToExcel = () => {
    try {
      const exportData = prepareTransactionsForExport(filteredTransactions);
      const date = new Date().toISOString().split('T')[0];
      const filename = `transactions_export_${date}.xlsx`;
      downloadExcel(exportData, transactionExportHeaders, filename);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export transactions to Excel.');
    }
  };

  // Function for printing a transaction receipt
  const handlePrintTransaction = (transaction) => {
    const receiptHtml = generateTransactionReceipt(transaction);
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      // Focus on the new window
      printWindow.focus();
    } else {
      setError('Failed to open print window. Pop-up blockers might be enabled.');
    }
  };

  // Generate a transaction receipt template
  const generateTransactionReceipt = (transaction) => {
    if (!transaction) return '';
    
    // Format date with time for receipt
    const formatDetailedDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      try {
        const options = { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
      } catch (e) {
        console.error('Error formatting detailed date:', e);
        return 'Invalid Date';
      }
    };
    
    // Format amount for receipt
    const formatReceiptAmount = (amount) => {
      if (typeof amount === 'number') {
        return `${Math.abs(amount).toLocaleString('fr-DZ')} DA`;
      } else if (typeof amount === 'string') {
        // Remove currency symbols and non-numeric chars except decimal point
        const cleaned = amount.replace(/[^\d.-]/g, '');
        const parsedAmount = parseFloat(cleaned);
        if (!isNaN(parsedAmount)) {
          return `${Math.abs(parsedAmount).toLocaleString('fr-DZ')} DA`;
        }
      }
      return '0,00 DA';
    };
    
    // Determine if this is income or expense
    const isIncome = transaction.amount >= 0;
    
    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Receipt - ${transaction.transactionId || 'Transaction'}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .receipt {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 5px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .transaction-id {
            font-size: 16px;
            color: #666;
          }
          .details {
            margin-bottom: 30px;
          }
          .detail-row {
            display: flex;
            margin-bottom: 10px;
          }
          .detail-label {
            flex: 0 0 150px;
            font-weight: bold;
          }
          .detail-value {
            flex: 1;
          }
          .amount {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .amount-income {
            color: #28a745;
          }
          .amount-expense {
            color: #dc3545;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
          }
          .status-completed {
            background-color: #e7f7ed;
            color: #28a745;
          }
          .status-pending {
            background-color: #fff8e1;
            color: #ffc107;
          }
          .status-failed, .status-cancelled {
            background-color: #ffebee;
            color: #dc3545;
          }
          .payment-type {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
          }
          .payment-type-in {
            background-color: #e7f7ed;
            color: #28a745;
          }
          .payment-type-out {
            background-color: #ffebee;
            color: #dc3545;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
            .print-btn {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">Transaction Receipt</div>
            <div class="transaction-id">ID: ${transaction.transactionId || 'N/A'}</div>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <div class="detail-label">Date:</div>
              <div class="detail-value">${formatDetailedDate(transaction.date)}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Service:</div>
              <div class="detail-value">${transaction.service || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Client Name:</div>
              <div class="detail-value">${transaction.clientName || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Created By:</div>
              <div class="detail-value">${transaction.creatorName || formatUserId(transaction.createdBy) || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Payment Method:</div>
              <div class="detail-value">${transaction.paymentMethod || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Payment Type:</div>
              <div class="detail-value">
                <span class="payment-type payment-type-${isIncome ? 'in' : 'out'}">
                  ${isIncome ? 'INCOME' : 'EXPENSE'}
                </span>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Status:</div>
              <div class="detail-value">
                <span class="status status-${transaction.status || 'pending'}">
                  ${(transaction.status || 'pending').toUpperCase()}
                </span>
              </div>
            </div>
            ${transaction.notes ? `
            <div class="detail-row">
              <div class="detail-label">Notes:</div>
              <div class="detail-value">${transaction.notes}</div>
            </div>
            ` : ''}
          </div>
          
          <div class="amount ${isIncome ? 'amount-income' : 'amount-expense'}">
            ${isIncome ? '+' : '-'} ${formatReceiptAmount(transaction.amount)}
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This receipt was generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div class="print-btn" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Receipt
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;
    
    return receiptHtml;
  };

  // The StatCard component
  const StatCard = ({ title, value, percentChange, theme, icon }) => {
    const isPositive = percentChange >= 0;
    
    let displayValue = value;
    
    // Special handling for Total Amount
    if (title === 'Total Amount') {
      if (typeof value === 'number') {
        displayValue = formatDisplayAmount(value);
      } else {
        displayValue = '0,00 DA';
      }
    }
    
    return (
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {icon}
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold">{displayValue}</p>
          <p className={`ml-2 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <span>{isPositive ? '↑' : '↓'} {Math.abs(percentChange)}%</span>
          </p>
        </div>
      </div>
    );
  };

  // Date range options
  const dateRangeOptions = [
    'Last 30 days',
    'Last 90 days',
    'This month',
    'Last month',
    'This year',
    'All time'
  ];

  // Handler for page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  // Status options for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'processing', label: 'Processing', color: 'blue' },
    { value: 'refunded', label: 'Refunded', color: 'purple' }
  ];

  // Debug information
  const filteredTransactions = transactions ? getFilteredTransactions() : [];

  // Debug information
  console.log('Current render state:', {
    transactionsCount: transactions ? transactions.length : 0,
    filteredCount: filteredTransactions.length,
    totalItems,
    totalPages,
    page,
    limit,
    filters
  });


  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Add Transaction Popup */}
      <AddTransactionPopup
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onSuccess={handleAddTransactionSuccess}
        transaction={currentTransaction}
        theme={theme}
      />
      
      {/* Excel Importer Component */}
      <ExcelImporter
        isOpen={isExcelImporterOpen}
        onClose={() => setIsExcelImporterOpen(false)}
        onSuccess={handleImportSuccess}
        theme={theme}
      />

      <DeleteAllConfirmationDialog />
      
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteAllConfirmation(true)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            <Trash size={18} />
            Delete All
          </button>
          {/* Excel Import Button */}
          <button
            onClick={handleOpenExcelImporter}
            className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <Upload size={18} />
            Import Excel
          </button>
          
          <div className="relative" ref={exportMenuRef}>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={18} />
              Export
            </button>
            
            {showExportMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } ring-1 ring-black ring-opacity-5`}>
                <div className="py-1">
                  <button
                    onClick={handleExportToCSV}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    } flex items-center`}
                  >
                    <FileText size={16} className="mr-2" />
                    Export to CSV
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    } flex items-center`}
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export to Excel
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleAddTransaction}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlusCircle size={18} />
            Create transaction
          </button>
        </div>
      </div>
      
      {/* Date Range and Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700">
            <Calendar size={18} />
            {dateRange}
          </button>
          <div className={`absolute left-0 mt-1 w-48 rounded-md shadow-lg z-10 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } ring-1 ring-black ring-opacity-5 hidden group-hover:block`}>
            <div className="py-1">
              {dateRangeOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleDateRangeChange(option)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    dateRange === option 
                      ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                      : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <button 
          className={`px-4 py-2 rounded border ${
            filters.status === '' 
              ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') 
              : (theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-300 bg-white text-gray-700')
          }`}
          onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
        >
          All Statuses
        </button>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Transactions" 
          value={stats.totalTransactions} 
          percentChange={12.5} 
          theme={theme}
          icon={<RefreshCw size={20} />}
        />
        <StatCard 
          title="Completed Transactions" 
          value={stats.completedTransactions} 
          percentChange={18.7} 
          theme={theme}
          icon={<PlusCircle size={20} />}
        />
        <StatCard 
          title="Pending Transactions" 
          value={stats.pendingTransactions} 
          percentChange={-5.2} 
          theme={theme}
          icon={<Calendar size={20} />}
        />
        <StatCard 
          title="Total Amount" 
          value={stats.totalAmount}
          percentChange={23.4} 
          theme={theme}
          icon={<DollarSign size={20} />}
        />
      </div>
      
      {/* Tab Filters */}
      <div className="flex mb-4 border-b border-gray-200">
        {['All', 'Completed', 'Pending', 'Failed'].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab 
                ? `border-b-2 border-blue-500 text-blue-600` 
                : `text-gray-500 hover:text-gray-700`
            }`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Search and Refresh */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
            }`}
          />
        </div>
        <button
          onClick={() => {
            // Log the current state before refresh
            console.log('Refreshing with explicit params:', { page, limit, filters });

            fetchTransactions();
          }}
          className={`p-2 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
          }`}
          title="Refresh transaction list"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {error && (
        <div className={`mb-4 p-3 rounded ${
          theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      )}
      
      {/* Total count display */}
      <div className="mb-4 text-sm">
        <span className="font-semibold">Total Records:</span> {totalItems} | 
        <span className="font-semibold ml-2">Showing:</span> {filteredTransactions.length}
        {searchTerm && <span className="ml-2 italic">(filtered by search)</span>}
        {activeTab !== 'All' && <span className="ml-2 italic">(filtered by {activeTab})</span>}
      </div>
      
      {/* Transactions Table */}
      <div className={`overflow-hidden rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Transaction ID</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction._id || transaction.transactionId}>
                    <td className="px-6 py-4 whitespace-nowrap">{transaction.transactionId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{transaction.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{transaction.clientName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">{transaction.creatorName || formatUserId(transaction.createdBy)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                      transaction.amount < 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {formatDisplayAmount(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.amount < 0 ? (
                        <span className="flex items-center text-red-500">
                          <ArrowUpRight size={16} className="mr-1" />
                          Expense
                        </span>
                      ) : (
                        <span className="flex items-center text-green-500">
                          <ArrowDownLeft size={16} className="mr-1" />
                          Income
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative" ref={openStatusDropdown === transaction._id ? statusDropdownRef : null}>
                        {/* Status Badge - Clickable for pending status */}
                        <button
                          onClick={() => {
                            if (transaction.status === 'pending') {
                              setOpenStatusDropdown(openStatusDropdown === transaction._id ? null : transaction._id);
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded-full flex items-center ${
                            theme === 'dark' 
                              ? transaction.status === 'completed' ? 'bg-green-900 text-green-300' 
                              : transaction.status === 'pending' ? 'bg-yellow-900 text-yellow-300'
                              : transaction.status === 'cancelled' ? 'bg-red-900 text-red-300'
                              : transaction.status === 'failed' ? 'bg-red-900 text-red-300'
                              : transaction.status === 'processing' ? 'bg-blue-900 text-blue-300'
                              : transaction.status === 'refunded' ? 'bg-purple-900 text-purple-300'
                              : 'bg-gray-700 text-gray-300'
                              : transaction.status === 'completed' ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                              : transaction.status === 'cancelled' ? 'bg-red-100 text-red-800'
                              : transaction.status === 'failed' ? 'bg-red-100 text-red-800'
                              : transaction.status === 'processing' ? 'bg-blue-100 text-blue-800'
                              : transaction.status === 'refunded' ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {transaction.status}
                          {transaction.status === 'pending' && (
                            <ChevronDown size={14} className="ml-1" />
                          )}
                        </button>

                        {/* Status Dropdown Menu */}
                        {openStatusDropdown === transaction._id && transaction.status === 'pending' && (
                          <div className={`absolute left-0 mt-1 w-36 rounded-md shadow-lg z-20 ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                          } ring-1 ring-black ring-opacity-5`}>
                            <div className="py-1">
                              {statusOptions.filter(option => option.value !== 'pending').map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => handleStatusUpdate(transaction._id || transaction.transactionId, option.value)}
                                  className={`w-full text-left px-3 py-2 text-sm flex items-center ${
                                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <span 
                                    className={`w-2 h-2 rounded-full mr-2 ${
                                      option.color === 'green' ? 'bg-green-500' :
                                      option.color === 'red' ? 'bg-red-500' :
                                      option.color === 'yellow' ? 'bg-yellow-500' :
                                      option.color === 'blue' ? 'bg-blue-500' :
                                      option.color === 'purple' ? 'bg-purple-500' :
                                      'bg-gray-500'
                                    }`} 
                                  />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{transaction.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handlePrintTransaction(transaction)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Print receipt"
                        >
                          <Printer size={18} className="text-gray-500" />
                        </button>
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Edit transaction"
                        >
                          <Pencil size={18} className="text-blue-500" />
                        </button>
                        <button 
                          onClick={() => handleDelete(transaction._id)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Delete transaction"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination - Updated for server side pagination */}
        {filteredTransactions.length > 0 && (
          <div className={`px-6 py-3 flex justify-between items-center border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="text-sm">
              Showing {Math.min((page - 1) * limit + 1, totalItems)} to {Math.min(page * limit, totalItems)} of {totalItems} transactions
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`p-1 rounded ${
                  page === 1
                    ? (theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400') 
                    : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              
              {/* Page number display */}
              <div className="flex items-center space-x-1">
                {/* First page button if not on first pages */}
                {page > 2 && (
                  <button
                    onClick={() => handlePageChange(1)}
                    className={`px-3 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    1
                  </button>
                )}
                
                {/* Ellipsis if not showing first page */}
                {page > 3 && (
                  <span className="text-gray-500">...</span>
                )}
                
                {/* Previous page button if not on first page */}
                {page > 1 && (
                  <button onClick={() => handlePageChange(page - 1)}
                  className={`px-3 py-1 rounded ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page - 1}
                </button>
                )}
                
                {/* Current page */}
                <button
                  className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}
                >
                  {page}
                </button>
                
                {/* Next page button if not on last page */}
                {page < totalPages && (
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    className={`px-3 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page + 1}
                  </button>
                )}
                
                {/* Ellipsis if not showing last page */}
                {page < totalPages - 2 && (
                  <span className="text-gray-500">...</span>
                )}
                
                {/* Last page button if not on last pages */}
                {page < totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className={`p-1 rounded ${
                  page >= totalPages
                    ? (theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                    : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionManagement;