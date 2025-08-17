// services/transactionService.js
import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseUrl}/transactions`;

// Helper function to convert date format
const convertDateFormat = (dateString) => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
    return dateString;
  }
  
  // Check for DD/MM/YYYY format
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.match(dateRegex);
  
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  
  // If format is unrecognized, return current date
  console.warn(`Unrecognized date format: ${dateString}, using current date`);
  return new Date().toISOString().split('T')[0];
};

class TransactionService {


  async createTransaction(transactionData) {
    try {
      const token = localStorage.getItem('token');
      
      // Ensure proper data formatting
      const formattedData = {
        ...transactionData,
        amount: parseFloat(transactionData.amount),
        isInstallment: Boolean(transactionData.isInstallment),
        date: convertDateFormat(transactionData.date)
      };
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log('Sending transaction data:', formattedData);
      const response = await axios.post(API_URL, formattedData, config);
      console.log('Transaction created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Transaction creation error:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw error.response.data.message || 'Failed to create transaction';
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw 'Network error - no response from server';
      } else {
        console.error('Request setup error:', error.message);
        throw error.message || 'Failed to create transaction';
      }
    }
  }
   

  async updateTransactionStatus(transactionId, newStatus) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Use the existing updateTransaction method but only send the status update
      const updateData = { status: newStatus };
      
      console.log(`Updating transaction ${transactionId} status to ${newStatus}`);
      const response = await axios.patch(`${API_URL}/${transactionId}`, updateData, config);
      return response.data;
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      throw error.response?.data?.message || 'Failed to update transaction status';
    }
  }
    
    async deleteAllTransactions() {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const data = {
          confirmationToken: 'DELETE_ALL_TRANSACTIONS_CONFIRM'
        };
        
        const response = await axios.delete(`${API_URL}/delete-all`, {
          ...config,
          data
        });
        
        console.log('All transactions deleted successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Failed to delete all transactions:', error);
        if (error.response) {
          throw error.response.data.message || 'Failed to delete all transactions';
        } else if (error.request) {
          throw 'Network error - no response from server';
        } else {
          throw error.message || 'Failed to delete all transactions';
        }
      }
    }
    
    // Replace your getAllTransactions method in the client-side services/transactionService.js
async getAllTransactions(page = 1, limit = 25, filters = {}) {
  try {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        page,
        limit
      }
    };
    
    // Add filters if provided - important change here for status handling
    if (filters.status !== undefined && filters.status !== null) {
      // Make sure we're always sending the status parameter, even if it's empty
      config.params.status = filters.status;
      console.log(`Setting status filter to: "${filters.status}"`);
    }
    
    if (filters.startDate) {
      config.params.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      config.params.endDate = filters.endDate;
    }
    
    if (filters.service) {
      config.params.service = filters.service;
    }
    
    if (filters.isInstallment !== undefined && filters.isInstallment !== null) {
      config.params.isInstallment = filters.isInstallment;
    }
    
    console.log('Fetching transactions with params:', config.params);
    
    // Debugging: Print the complete endpoint URL with parameters
    const urlParams = new URLSearchParams(config.params);
    console.log(`Full API request: ${API_URL}/all?${urlParams.toString()}`);
    
    const response = await axios.get(`${API_URL}/all`, config);
    console.log('Transactions API response:', response.data);
    
    // Rest of the method remains the same...
    let result = {
      transactions: [],
      pagination: {
        currentPage: page,
        totalPages: 1,
        totalItems: 0
      },
      stats: {
        totalTransactions: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0,
        totalAmount: 0
      }
    };
    
    // Extract data based on response structure
    if (response.data) {
      // Get the main data object - handles different response structures
      let responseData = null;
      
      if (response.data.data) {
        responseData = response.data.data;
      } else if (response.data.success && response.data.data === undefined) {
        // If success is true but no data property, the data might be at the root
        const { success, message, ...restData } = response.data;
        responseData = restData;
      } else {
        // Fallback to the entire response
        responseData = response.data;
      }
      
      // Process the data object
      if (responseData) {
        // Extract transactions array
        if (Array.isArray(responseData.transactions)) {
          result.transactions = responseData.transactions;
        } else if (Array.isArray(responseData)) {
          result.transactions = responseData;
        }
        
        // Process pagination
        const paginationData = responseData.pagination || responseData;
        
        // Direct pagination properties
        if (paginationData.totalPages !== undefined) {
          result.pagination.totalPages = paginationData.totalPages;
        } else if (paginationData.pages !== undefined) {
          result.pagination.totalPages = paginationData.pages;
        }
        
        if (paginationData.currentPage !== undefined) {
          result.pagination.currentPage = paginationData.currentPage;
        } else if (paginationData.page !== undefined) {
          result.pagination.currentPage = paginationData.page;
        }
        
        if (paginationData.totalItems !== undefined) {
          result.pagination.totalItems = paginationData.totalItems;
        } else if (paginationData.total !== undefined) {
          result.pagination.totalItems = paginationData.total;
        }
        
        // Process stats
        const statsData = responseData.stats || responseData;
        
        // Direct stats properties - check both camelCase and snake_case
        const statsMapping = {
          totalTransactions: ['totalTransactions', 'total_transactions'], 
          completedTransactions: ['completedTransactions', 'completed_transactions'],
          pendingTransactions: ['pendingTransactions', 'pending_transactions'],
          failedTransactions: ['failedTransactions', 'failed_transactions'],
          totalAmount: ['totalAmount', 'total_amount']
        };
        
        // Try to extract stats from the response using the mapping
        Object.entries(statsMapping).forEach(([resultKey, possibleKeys]) => {
          for (const key of possibleKeys) {
            if (statsData[key] !== undefined) {
              result.stats[resultKey] = statsData[key];
              break;
            }
          }
        });
        
        // Calculate stats from transactions if not provided by API
        if (result.stats.totalTransactions === 0 && result.transactions.length > 0) {
          // Calculate stats directly from the transactions
          const completed = result.transactions.filter(tx => tx.status === 'completed').length;
          const pending = result.transactions.filter(tx => tx.status === 'pending').length;
          const failed = result.transactions.filter(tx => 
            tx.status === 'failed' || tx.status === 'cancelled'
          ).length;
          
          let totalAmount = 0;
          result.transactions.forEach(tx => {
            if (typeof tx.amount === 'number') {
              totalAmount += tx.amount;
            } else if (typeof tx.amount === 'string') {
              const cleaned = tx.amount.replace(/[^\d.-]/g, '');
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed)) {
                totalAmount += parsed;
              }
            }
          });
          
          result.stats = {
            totalTransactions: result.transactions.length,
            completedTransactions: completed,
            pendingTransactions: pending,
            failedTransactions: failed,
            totalAmount: totalAmount
          };
        }
      }
    }
    
    console.log('Processed transactions data:', {
      count: result.transactions.length,
      pagination: result.pagination,
      stats: result.stats
    });
    
    return result;
  } catch (error) {
    console.error('API error details:', error.response || error);
    throw error.response?.data?.message || 'Failed to fetch all transactions';
  }
}
    
    async getClientTransactions(page = 1, limit = 25) {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            },
            params: {
              page,
              limit
            }
          };
          
          const response = await axios.get(`${API_URL}/my-transactions`, config);
          
          // Format the response similar to getAllTransactions
          let result = {
            transactions: [],
            pagination: {
              currentPage: page,
              totalPages: 1,
              totalItems: 0
            }
          };
          
          if (response.data && response.data.data) {
            if (Array.isArray(response.data.data.transactions)) {
              result.transactions = response.data.data.transactions;
            } else if (Array.isArray(response.data.data)) {
              result.transactions = response.data.data;
            }
            
            if (response.data.data.pagination) {
              result.pagination = response.data.data.pagination;
            }
          } else if (response.data && Array.isArray(response.data.transactions)) {
            result.transactions = response.data.transactions;
            
            if (response.data.pagination) {
              result.pagination = response.data.pagination;
            }
          } else if (response.data && response.data.pagination) {
            result.pagination = response.data.pagination;
          }
          
          return result;
        } catch (error) {
          throw error.response?.data?.message || 'Failed to fetch client transactions';
        }
    }

    // Remaining methods stay the same
    async getTransactionById(transactionId) {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
          
          const response = await axios.get(`${API_URL}/${transactionId}`, config);
          return response.data;
        } catch (error) {
          throw error.response?.data?.message || 'Failed to fetch transaction';
        }
    }
    
    async getTransactionByExternalId(externalId) {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
          
          const response = await axios.get(`${API_URL}/external/${externalId}`, config);
          return response.data;
        } catch (error) {
          throw error.response?.data?.message || 'Failed to fetch transaction by external ID';
        }
    }

    async getTransactionsByOrder(orderId) {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
          
          const response = await axios.get(`${API_URL}/order/${orderId}`, config);
          return response.data;
        } catch (error) {
          throw error.response?.data?.message || 'Failed to fetch transactions for order';
        }
    }

    async updateTransaction(transactionId, updateData) {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          };
          
          const response = await axios.patch(`${API_URL}/${transactionId}`, updateData, config);
          return response.data;
        } catch (error) {
          throw error.response?.data?.message || 'Failed to update transaction';
        }
    }

    async deleteTransaction(transactionId) {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
          
          const response = await axios.delete(`${API_URL}/${transactionId}`, config);
          return response.data;
        } catch (error) {
          throw error.response?.data?.message || 'Failed to delete transaction';
        }
    }

    async getTransactionStatistics(startDate, endDate) {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            },
            params: {}
          };
          
          if (startDate) {
            config.params.startDate = startDate;
          }
          
          if (endDate) {
            config.params.endDate = endDate;
          }
          
          const response = await axios.get(`${API_URL}/statistics`, config);
          return response.data;
        } catch (error) {
          throw error.response?.data?.message || 'Failed to fetch transaction statistics';
        }
    }
    
    // Import transactions from Excel
    async importTransactions(transactions) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        };
        
        // Format transaction data to ensure proper values
        const formattedTransactions = transactions.map(transaction => ({
          ...transaction,
          amount: parseFloat(transaction.amount),
          isInstallment: Boolean(transaction.isInstallment),
          date: convertDateFormat(transaction.date)
        }));
        
        console.log('Sending import data:', { transactions: formattedTransactions });
        
        try {
          // Try the bulk import endpoint first
          const response = await axios.post(`${API_URL}/import`, { transactions: formattedTransactions }, config);
          console.log('Transactions imported successfully:', response.data);
          return response.data;
        } catch (importError) {
          console.warn('Bulk import endpoint failed, falling back to individual imports:', importError);
          
          // If status is 404, the endpoint doesn't exist, so we'll fall back to individual imports
          const results = [];
          let successCount = 0;
          
          // Process each transaction individually
          for (const transaction of formattedTransactions) {
            try {
              const resp = await axios.post(API_URL, transaction, config);
              results.push({
                success: true,
                transaction: resp.data.data,
                transactionId: transaction.transactionId || resp.data.data.transactionId
              });
              successCount++;
            } catch (singleError) {
              console.error('Error importing single transaction:', singleError);
              results.push({
                success: false,
                error: singleError.response?.data?.message || 'Failed to import transaction',
                transactionId: transaction.transactionId
              });
            }
          }
          
          // Return a response similar to what the bulk endpoint would return
          return {
            success: successCount > 0,
            message: `Imported ${successCount} of ${formattedTransactions.length} transactions`,
            data: {
              totalProcessed: formattedTransactions.length,
              successCount,
              failureCount: formattedTransactions.length - successCount,
              results
            }
          };
        }
      } catch (error) {
        console.error('Transaction import error:', error);
        if (error.response) {
          console.error('Server response:', error.response.data);
          throw error.response.data.message || 'Failed to import transactions';
        } else if (error.request) {
          console.error('No response received:', error.request);
          throw 'Network error - no response from server';
        } else {
          console.error('Request setup error:', error.message);
          throw error.message || 'Failed to import transactions';
        }
      }
    }
    
    // Utility functions that can be used within the service
    formatAmount(amount) {
        if (amount === undefined || amount === null) return 'DZD 0.00';
        return new Intl.NumberFormat('fr-DZ', {
          style: 'currency',
          currency: 'DZD',
          minimumFractionDigits: 2
        }).format(amount);
    }
    
    isPositiveAmount(amount) {
        return amount >= 0;
    }
    
    calculateRemainingBalance(transactions) {
        if (!transactions || !transactions.length) return 0;
        
        // Get total of all completed transactions
        const totalPaid = transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);
        
        // Get the first transaction to determine total expected amount
        const firstTransaction = transactions.sort((a, b) =>
          new Date(a.date) - new Date(b.date)
        )[0];
        
        // If we can't determine total, return just total paid amount
        if (!firstTransaction || !firstTransaction.totalAmount) {
          return totalPaid;
        }
        
        return firstTransaction.totalAmount - totalPaid;
    }
    
    // Get available services (unique values from transactions)
    async getAvailableServices() {
        try {
            const response = await this.getAllTransactions(1, 1000);
            const transactions = response.transactions || [];
            
            // Extract unique service values
            const services = [...new Set(transactions.map(tx => tx.service))].filter(Boolean);
            return services;
        } catch (error) {
            console.error('Error fetching available services:', error);
            return [];
        }
    }
    
    // Get available payment methods (unique values from transactions)
    async getAvailablePaymentMethods() {
        try {
            const response = await this.getAllTransactions(1, 1000);
            const transactions = response.transactions || [];
            
            // Extract unique payment method values
            const paymentMethods = [...new Set(transactions.map(tx => tx.paymentMethod))].filter(Boolean);
            return paymentMethods;
        } catch (error) {
            console.error('Error fetching available payment methods:', error);
            return [];
        }
    }
    
    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
}

export default new TransactionService();