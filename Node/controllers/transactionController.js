// controllers/transactionController.js
import { TransactionService } from '../services/transactionService.js';

export class TransactionController {
  constructor() {
    this.transactionService = new TransactionService();
  }

  createTransaction = async (req, res) => {
    try {
      const transactionData = {
        ...req.body,
        createdBy: req.user._id
      };

      const transaction = await this.transactionService.createTransaction(transactionData);
      
      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getTransactionById = async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await this.transactionService.getTransactionById(transactionId);
      
      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  getTransactionByExternalId = async (req, res) => {
    try {
      const { externalId } = req.params;
      const transaction = await this.transactionService.getTransactionByExternalId(externalId);
      
      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  getClientTransactions = async (req, res) => {
    try {
      const { page, limit } = req.query;
      const result = await this.transactionService.getClientTransactions(
        req.user._id,
        parseInt(page) || 1,
        parseInt(limit) || 25
      );
      
      res.status(200).json({
        success: true,
        data: {
          transactions: result.transactions,
          pagination: result.pagination
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getAllTransactions = async (req, res) => {
    try {
      const { page, limit, startDate, endDate, status, service, isInstallment, includeStats } = req.query;
      
      // Build filters object
      const filters = {};
      if (startDate || endDate) {
        filters.date = {};
        if (startDate) filters.date.$gte = new Date(startDate);
        if (endDate) filters.date.$lte = new Date(endDate);
      }
      if (status) filters.status = status;
      if (service) filters.service = service;
      if (isInstallment !== undefined) filters.isInstallment = isInstallment === 'true';
      
      const result = await this.transactionService.getAllTransactions(
        parseInt(page) || 1,
        parseInt(limit) || 25,
        filters,
        includeStats === 'true'
      );
      
      res.status(200).json({
        success: true,
        data: {
          transactions: result.transactions,
          pagination: result.pagination,
          stats: result.stats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  updateTransaction = async (req, res) => {
    try {
      const { transactionId } = req.params;
      const updateData = req.body;
      
      const transaction = await this.transactionService.updateTransaction(
        transactionId,
        updateData
      );
      
      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  deleteTransaction = async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      const transaction = await this.transactionService.deleteTransaction(transactionId);
      
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Transaction cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // New method to delete all transactions
  deleteAllTransactions = async (req, res) => {
    try {
      const filters = req.body.filters || {};
      
      // Add additional security - require a confirmation token
      const { confirmationToken } = req.body;
      
      if (confirmationToken !== 'DELETE_ALL_TRANSACTIONS_CONFIRM') {
        return res.status(400).json({
          success: false,
          message: 'Confirmation token required to delete all transactions'
        });
      }
      
      const result = await this.transactionService.deleteAllTransactions(filters);
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully deleted ${result.deletedCount} transactions`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete all transactions'
      });
    }
  }

  getTransactionsByOrder = async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const transactions = await this.transactionService.getTransactionsByOrder(orderId);
      
      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  importTransactions = async (req, res) => {
    try {
      const { transactions } = req.body;
      
      console.log(`Attempting to import ${transactions?.length || 0} transactions`);
      
      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or empty transactions array'
        });
      }
      
      const results = [];
      let successCount = 0;
      let validationErrors = 0;
      let referenceErrors = 0;
      let duplicateErrors = 0;
      let otherErrors = 0;
      
      // Helper function to convert date format from DD/MM/YYYY to YYYY-MM-DD
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
      
      // Process each transaction
      for (let i = 0; i < transactions.length; i++) {
        const transactionData = transactions[i];
        try {
          console.log(`Processing transaction ${i+1}/${transactions.length}: ${transactionData.transactionId || 'No ID'}`);
          
          // Data validation
          if (!transactionData.service) {
            throw new Error('Service field is required');
          }
          
          if (transactionData.amount === undefined || transactionData.amount === null) {
            throw new Error('Amount field is required');
          }
          
          // Type conversion and cleanup
          const cleanedData = {
            ...transactionData,
            amount: typeof transactionData.amount === 'string' 
              ? parseFloat(transactionData.amount.replace(/[^\d.-]/g, '')) 
              : transactionData.amount,
            isInstallment: Boolean(transactionData.isInstallment),
            date: convertDateFormat(transactionData.date), // Convert date format here
            createdBy: req.user._id
          };
          
          // Check for NaN after parsing
          if (isNaN(cleanedData.amount)) {
            throw new Error(`Invalid amount format: ${transactionData.amount}`);
          }
          
          // Create the transaction
          const transaction = await this.transactionService.createTransaction(cleanedData);
          
          // Add to results
          results.push({
            success: true,
            index: i,
            transactionId: transactionData.transactionId || transaction.transactionId,
            id: transaction._id
          });
          
          successCount++;
        } catch (error) {
          console.error(`Error importing transaction ${i+1}:`, error.message);
          
          // Categorize errors
          if (error.message.includes('validation')) {
            validationErrors++;
          } else if (error.message.includes('reference') || error.message.includes('ObjectId')) {
            referenceErrors++;
          } else if (error.message.includes('duplicate') || error.message.includes('E11000')) {
            duplicateErrors++;
          } else {
            otherErrors++;
          }
          
          // Add failed transaction to results with detailed error
          results.push({
            success: false,
            index: i,
            transactionId: transactionData.transactionId,
            service: transactionData.service,
            amount: transactionData.amount,
            error: error.message,
            rawData: JSON.stringify(transactionData).substring(0, 100) + '...' // First 100 chars for debugging
          });
        }
      }
      
      // Create error summary
      const errorSummary = {
        validationErrors,
        referenceErrors,
        duplicateErrors,
        otherErrors
      };
      
      console.log('Import summary:', {
        total: transactions.length,
        success: successCount,
        failed: transactions.length - successCount,
        errorSummary
      });
      
      res.status(200).json({
        success: successCount > 0,
        message: `Successfully imported ${successCount} of ${transactions.length} transactions`,
        data: {
          totalProcessed: transactions.length,
          successCount,
          failureCount: transactions.length - successCount,
          errorSummary,
          results
        }
      });
    } catch (error) {
      console.error('Fatal error during import:', error);
      res.status(500).json({
        success: false,
        message: `Failed to import transactions: ${error.message}`
      });
    }
  }
  
  getTransactionStatistics = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const statistics = await this.transactionService.getTransactionStatistics(
        startDate,
        endDate
      );
      
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}