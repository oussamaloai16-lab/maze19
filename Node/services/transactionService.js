// services/transactionService.js
import Transaction from '../models/transactionModel.js';

export class TransactionService {
  async createTransaction(transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      await transaction.save();
      return transaction;
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  // async getAllTransactions(page = 1, limit = 25, filters = {}) {
  //   try {
  //     const options = {
  //       page,
  //       limit,
  //       sort: { date: -1 },
  //       populate: [
  //         { path: 'clientId', select: 'username name email' },
  //         { path: 'createdBy', select: 'username name email' }
  //       ]
  //     };

  //     // Build the query based on filters
  //     const query = {};
  //     if (filters.status) query.status = filters.status;
  //     if (filters.service) query.service = filters.service;
  //     if (filters.isInstallment !== undefined) query.isInstallment = filters.isInstallment;
      
  //     // Date range filter
  //     if (filters.date) {
  //       query.date = {};
  //       if (filters.date.$gte) query.date.$gte = filters.date.$gte;
  //       if (filters.date.$lte) query.date.$lte = filters.date.$lte;
  //     }

  //     // Execute the query
  //     let transactions;
      
  //     // Check if pagination is needed
  //     if (page && limit) {
  //       const skip = (page - 1) * limit;
  //       transactions = await Transaction.find(query)
  //         .populate('clientId', 'username name email')
  //         .populate('createdBy', 'username name email')
  //         .sort({ date: -1 })
  //         .skip(skip)
  //         .limit(limit);
          
  //       const total = await Transaction.countDocuments(query);
        
  //       // Process transactions to add clientName and createdByName properties
  //       const processedTransactions = transactions.map(transaction => {
  //         const data = transaction.toObject({ virtuals: true });
          
  //         // Add clientName from populated clientId document
  //         if (data.clientId) {
  //           data.clientName = data.clientId.username || data.clientId.name || data.clientId.email || 'Unknown';
  //         } else {
  //           data.clientName = 'N/A';
  //         }
          
  //         // Add createdByName from populated createdBy document
  //         if (data.createdBy) {
  //           data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
  //         } else {
  //           data.creatorName = 'N/A';
  //         }
          
  //         return data;
  //       });
        
  //       return {
  //         transactions: processedTransactions,
  //         totalPages: Math.ceil(total / limit),
  //         currentPage: page,
  //         totalItems: total
  //       };
  //     } else {
  //       // If no pagination, return all matching transactions
  //       transactions = await Transaction.find(query)
  //         .populate('clientId', 'username name email')
  //         .populate('createdBy', 'username name email')
  //         .sort({ date: -1 });
          
  //       // Process transactions to add clientName and createdByName properties
  //       return transactions.map(transaction => {
  //         const data = transaction.toObject({ virtuals: true });
          
  //         // Add clientName from populated clientId document
  //         if (data.clientId) {
  //           data.clientName = data.clientId.username || data.clientId.name || data.clientId.email || 'Unknown';
  //         } else {
  //           data.clientName = 'N/A';
  //         }
          
  //         // Add createdByName from populated createdBy document
  //         if (data.createdBy) {
  //           data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
  //         } else {
  //           data.creatorName = 'N/A';
  //         }
          
  //         return data;
  //       });
  //     }
  //   } catch (error) {
  //     throw new Error(`Failed to get transactions: ${error.message}`);
  //   }
  // }

  // Replace your getAllTransactions method in services/transactionService.js (backend)
async getAllTransactions(filters = {}) {
  try {
    // Build the query based on filters
    const query = {};
    
    // Print debugging info
    console.log("Filter status received:", filters.status);
    
    // Handle status filter specifically
    if (filters.status) {
      if (filters.status.includes(',')) {
        // Multiple statuses (e.g. 'failed,cancelled')
        const statusArray = filters.status.split(',').map(s => s.trim());
        query.status = { $in: statusArray };
        console.log("Setting status filter to multiple values:", statusArray);
      } else {
        // Single status
        query.status = filters.status;
        console.log("Setting status filter to single value:", filters.status);
      }
    }
    
    if (filters.service) query.service = filters.service;
    if (filters.isInstallment !== undefined) query.isInstallment = filters.isInstallment;
    
    // Date range filter
    if (filters.date) {
      query.date = {};
      if (filters.date.$gte) query.date.$gte = filters.date.$gte;
      if (filters.date.$lte) query.date.$lte = filters.date.$lte;
    } else if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }
    
    console.log('Final query for MongoDB:', JSON.stringify(query));
    
    // Find transactions with the query
    const transactions = await Transaction.find(query)
      .populate('clientId', 'username name email')
      .populate('createdBy', 'username name email')
      .sort({ date: -1 });
    
    console.log(`Query returned ${transactions.length} transactions`);
    
    // Process transactions to add clientName and creatorName properties
    const processedTransactions = transactions.map(transaction => {
      const data = transaction.toObject({ virtuals: true });
      
      // Add clientName from populated clientId document
      if (data.clientId) {
        data.clientName = data.clientId.username || data.clientId.name || data.clientId.email || 'Unknown';
      } else {
        data.clientName = 'N/A';
      }
      
      // Add creatorName from populated createdBy document
      if (data.createdBy) {
        data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
      } else {
        data.creatorName = 'N/A';
      }
      
      return data;
    });
    
    // Calculate status counts
    const completedCount = transactions.filter(tx => tx.status === 'completed').length;
    const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
    const failedCount = transactions.filter(tx => 
      tx.status === 'failed' || tx.status === 'cancelled'
    ).length;
    
    // Calculate total amount
    let totalAmount = transactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => {
        return sum + (typeof tx.amount === 'number' ? tx.amount : 0);
      }, 0);
    
    return {
      transactions: processedTransactions,
      totalPages: 1,
      currentPage: 1,
      totalItems: transactions.length,
      stats: {
        totalTransactions: transactions.length,
        completedTransactions: completedCount,
        pendingTransactions: pendingCount,
        failedTransactions: failedCount,
        totalAmount
      }
    };
  } catch (error) {
    console.error('Error in getAllTransactions:', error);
    throw new Error(`Failed to get transactions: ${error.message}`);
  }
}

  async getClientTransactions(clientId, page = 1, limit = 25) {
    try {
      const skip = (page - 1) * limit;
      
      const transactions = await Transaction.find({ clientId })
        .populate('clientId', 'username name email')
        .populate('createdBy', 'username name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);
        
      const total = await Transaction.countDocuments({ clientId });
      
      // Process transactions to add clientName and createdByName
      const processedTransactions = transactions.map(transaction => {
        const data = transaction.toObject({ virtuals: true });
        
        // Add clientName from populated clientId document
        if (data.clientId) {
          data.clientName = data.clientId.username || data.clientId.name || data.clientId.email || 'Unknown';
        } else {
          data.clientName = 'N/A';
        }
        
        // Add createdByName from populated createdBy document
        if (data.createdBy) {
          data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
        } else {
          data.creatorName = 'N/A';
        }
        
        return data;
      });
      
      return {
        transactions: processedTransactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total
      };
    } catch (error) {
      throw new Error(`Failed to get client transactions: ${error.message}`);
    }
  }

  async getTransactionById(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate('clientId', 'username name email')
        .populate('createdBy', 'username name email')
        .populate({
          path: 'relatedTransactions',
          populate: [
            { path: 'clientId', select: 'username name email' },
            { path: 'createdBy', select: 'username name email' }
          ]
        });
        
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Convert to object and add clientName and createdByName
      const data = transaction.toObject({ virtuals: true });
      
      // Add clientName from populated clientId document
      if (data.clientId) {
        data.clientName = data.clientId.username || data.clientId.name || data.clientId.email || 'Unknown';
      } else {
        data.clientName = 'N/A';
      }
      
      // Add createdByName from populated createdBy document
      if (data.createdBy) {
        data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
      } else {
        data.creatorName = 'N/A';
      }
      
      // Process related transactions as well
      if (data.relatedTransactions && data.relatedTransactions.length > 0) {
        data.relatedTransactions = data.relatedTransactions.map(relatedTx => {
          const txData = relatedTx;
          
          // Add clientName from populated clientId document
          if (txData.clientId) {
            txData.clientName = txData.clientId.username || txData.clientId.name || txData.clientId.email || 'Unknown';
          } else {
            txData.clientName = 'N/A';
          }
          
          // Add createdByName from populated createdBy document
          if (txData.createdBy) {
            txData.creatorName = txData.createdBy.username || txData.createdBy.name || txData.createdBy.email || 'Unknown';
          } else {
            txData.creatorName = 'N/A';
          }
          
          return txData;
        });
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  async getTransactionByExternalId(externalId) {
    try {
      const transaction = await Transaction.findOne({ transactionId: externalId })
        .populate('clientId', 'username name email')
        .populate('createdBy', 'username name email');
        
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Convert to object and add clientName and createdByName
      const data = transaction.toObject({ virtuals: true });
      
      // Add clientName from populated clientId document
      if (data.clientId) {
        data.clientName = data.clientId.username || data.clientId.name || data.clientId.email || 'Unknown';
      } else {
        data.clientName = 'N/A';
      }
      
      // Add createdByName from populated createdBy document
      if (data.createdBy) {
        data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
      } else {
        data.creatorName = 'N/A';
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  async getTransactionsByOrder(orderId) {
    try {
      const transactions = await Transaction.find({ orderId })
        .populate('clientId', 'username name email')
        .populate('createdBy', 'username name email')
        .sort({ date: -1 });
        
      // Process transactions to add clientName and createdByName
      return transactions.map(transaction => {
        const data = transaction.toObject({ virtuals: true });
        
        // Add clientName from populated clientId document
        if (data.clientId) {
          data.clientName = data.clientId.username || data.clientId.name || data.clientId.email || 'Unknown';
        } else {
          data.clientName = 'N/A';
        }
        
        // Add createdByName from populated createdBy document
        if (data.createdBy) {
          data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
        } else {
          data.creatorName = 'N/A';
        }
        
        return data;
      });
    } catch (error) {
      throw new Error(`Failed to get transactions for order: ${error.message}`);
    }
  }

  async updateTransaction(transactionId, updateData) {
    try {
      const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('clientId', 'username name email')
        .populate('createdBy', 'username name email');
        
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Convert to object and add clientName and createdByName
      const data = transaction.toObject({ virtuals: true });
      
      // Add clientName from populated clientId document
      if (data.clientId) {
        data.clientName = data.clientId.username || data.clientId.name || data.clientId.email || 'Unknown';
      } else {
        data.clientName = 'N/A';
      }
      
      // Add createdByName from populated createdBy document
      if (data.createdBy) {
        data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
      } else {
        data.creatorName = 'N/A';
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }
  }

  async deleteTransaction(transactionId) {
    try {
      // We'll just mark it as cancelled instead of actually deleting it
      const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        { status: 'cancelled', updatedAt: Date.now() },
        { new: true }
      );
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      return transaction;
    } catch (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }
  
  async deleteAllTransactions(filters = {}) {
    try {
      // Build query from filters if provided
      const query = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.service) query.service = filters.service;
      if (filters.isInstallment !== undefined) query.isInstallment = filters.isInstallment;
      
      // Date range filter
      if (filters.date) {
        query.date = {};
        if (filters.date.$gte) query.date.$gte = filters.date.$gte;
        if (filters.date.$lte) query.date.$lte = filters.date.$lte;
      }
      
      // This actually deletes the records from the database
      const result = await Transaction.deleteMany(query);
      
      return {
        success: true,
        deletedCount: result.deletedCount || 0,
        message: `Successfully deleted ${result.deletedCount || 0} transactions from the database`
      };
    } catch (error) {
      throw new Error(`Failed to delete all transactions: ${error.message}`);
    }
  }

  async getTransactionStatistics(startDate, endDate) {
    try {
      const query = {};
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      // Get all transactions
      const transactions = await Transaction.find(query);
      
      // Calculate statistics
      const totalTransactions = transactions.length;
      const completedTransactions = transactions.filter(tx => tx.status === 'completed').length;
      const pendingTransactions = transactions.filter(tx => tx.status === 'pending').length;
      const cancelledTransactions = transactions.filter(tx => tx.status === 'cancelled').length;
      
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const completedAmount = transactions.filter(tx => tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
      
      // Group by service
      const serviceStats = {};
      transactions.forEach(tx => {
        if (!serviceStats[tx.service]) {
          serviceStats[tx.service] = {
            count: 0,
            amount: 0
          };
        }
        serviceStats[tx.service].count += 1;
        serviceStats[tx.service].amount += tx.amount;
      });
      
      // Group by payment method
      const paymentMethodStats = {};
      transactions.forEach(tx => {
        if (!paymentMethodStats[tx.paymentMethod]) {
          paymentMethodStats[tx.paymentMethod] = {
            count: 0,
            amount: 0
          };
        }
        paymentMethodStats[tx.paymentMethod].count += 1;
        paymentMethodStats[tx.paymentMethod].amount += tx.amount;
      });
      
      return {
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        cancelledTransactions,
        totalAmount,
        completedAmount,
        serviceStats,
        paymentMethodStats,
        dateRange: {
          start: startDate ? new Date(startDate) : null,
          end: endDate ? new Date(endDate) : null
        }
      };
    } catch (error) {
      throw new Error(`Failed to get transaction statistics: ${error.message}`);
    }
  }
  
  // Utility methods
  formatAmount(amount) {
    if (amount === undefined || amount === null) return '0,00 DA';
    
    // Convert to number if it's a string
    let numericAmount = amount;
    if (typeof amount === 'string') {
      // Remove any non-numeric characters except decimal separator
      numericAmount = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'));
    }
    
    if (isNaN(numericAmount)) return '0,00 DA';
    
    // Format like "10 000,00 DA"
    return numericAmount.toLocaleString('fr-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('.', ',') + ' DA';
  }
  
  isPositiveAmount(amount) {
    return parseFloat(amount) > 0;
  }
}

// Create an instance for direct import
const transactionService = new TransactionService();
export default transactionService;