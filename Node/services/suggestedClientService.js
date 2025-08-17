// services/suggestedClientService.js
import SuggestedClient from '../models/suggestedClientModel.js';
import User from '../models/userModel.js';
import cacheService from './cacheService.js';

export class SuggestedClientService {
    async createSuggestedClient(clientData) {
        try {
          // Generate the client ID before creating the client
          if (!clientData.suggestedClientId) {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            
            const count = await SuggestedClient.countDocuments({}) + 1;
            clientData.suggestedClientId = `SC-${year}${month}-${count.toString().padStart(4, '0')}`;
          }
      
          const client = new SuggestedClient(clientData);
          await client.save();
          
          // Invalidate cache since new data was added
          await cacheService.invalidateListsAndStats();
          console.log('🗑️ Cache invalidated after creating new client');
          
          return client;
        } catch (error) {
          throw new Error(`Failed to create suggested client: ${error.message}`);
        }
      }

  async getAllSuggestedClients(page = 1, limit = 25, filters = {}) {
    try {
      // Check cache first
      const cacheResult = await cacheService.getCachedClients(page, limit, filters);
      if (cacheResult.success) {
        console.log('🚀 Returning cached suggested clients data');
        return cacheResult.data;
      }

      console.log('🔍 Cache miss - fetching from database...');
      console.log('📋 Received filters:', filters);
      
      // Build the query based on filters
      const query = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.wilaya) query.wilaya = filters.wilaya;
      if (filters.priority) query.priority = filters.priority;
      if (filters.assignedTo) query.assignedTo = filters.assignedTo;
      if (filters.createdBy) query.createdBy = filters.createdBy;
      if (filters.isValidated !== undefined) query.isValidated = filters.isValidated;
      if (filters.businessType) {
        query.businessType = { $regex: new RegExp(`^${filters.businessType}$`, 'i') };
        console.log(`🏢 Business type filter applied: "${filters.businessType}" (exact match, case-insensitive)`);
      }
      
      // Score-based filtering with credit costs
      if (filters.scoreRange) {
        switch (filters.scoreRange) {
          case 'low': // Low: < 100 (1 credit)
            query.score = { $lt: 100 };
            break;
          case 'medium': // Medium: 100-400 (2 credits)
            query.score = { $gte: 100, $lte: 400 };
            break;
          case 'high': // High: > 400 (3 credits)
            query.score = { $gt: 400 };
            break;
          default:
            // No score filter applied
            break;
        }
      }
      
      // Handle "Score > 0" tab filter
      if (filters.scoreMin !== undefined) {
        query.score = { $gte: filters.scoreMin };
      }
      
      // Handle "Call Back Later" filter
      if (filters.callBackLater) {
        query['callLogs.callOutcome'] = 'call_back_later';
        console.log('📞 Call Back Later filter applied');
      }
      
      // Search functionality
      if (filters.$or) query.$or = filters.$or;
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }
      
      const skip = (page - 1) * limit;
      
      console.log('🔍 Final MongoDB query:', JSON.stringify(query, null, 2));
      
      const clients = await SuggestedClient.find(query)
        .populate('createdBy', 'username name email')
        .populate('assignedTo', 'username name email')
        .populate('validatedBy', 'username name email')
        .populate('callLogs.calledBy', 'username name email');
      
      let sortedClients;
      
      // Check if custom sorting is requested
      if (filters.sortBy && filters.sortOrder) {
        console.log(`🔄 Applying custom sorting: ${filters.sortBy} ${filters.sortOrder}`);
        
        sortedClients = clients.sort((a, b) => {
          let aValue, bValue;
          
          if (filters.sortBy === 'createdAt') {
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
          } else if (filters.sortBy === 'updatedAt') {
            aValue = new Date(a.updatedAt);
            bValue = new Date(b.updatedAt);
          } else {
            // Default to createdAt if unknown sortBy
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
          }
          
          if (filters.sortOrder === 'desc') {
            return bValue - aValue; // Newest first
          } else {
            return aValue - bValue; // Oldest first
          }
        });
      } else {
        // Default custom sorting: Priority wilayas first, then oldest leads first
        // This ensures closers see priority regions first and new leads don't distract them
        const priorityWilayas = ['Tipaza', 'Alger', 'Algiers', 'Blida', 'Boumerdes'];
        
        console.log(`🔄 Sorting ${clients.length} clients with priority wilayas first, then oldest first...`);
        sortedClients = clients.sort((a, b) => {
          // First, check if either is a priority wilaya (case-insensitive)
          const aIsPriority = priorityWilayas.some(pw => 
            pw.toLowerCase() === (a.wilaya || '').toLowerCase()
          );
          const bIsPriority = priorityWilayas.some(pw => 
            pw.toLowerCase() === (b.wilaya || '').toLowerCase()
          );
          
          if (aIsPriority && !bIsPriority) {
            return -1; // a comes first
          }
          if (!aIsPriority && bIsPriority) {
            return 1; // b comes first
          }
          
          // If both are priority or both are non-priority, sort by creation date (oldest first)
          // This puts new leads at the end instead of the beginning
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
      }
      
      // Apply pagination to sorted results
      const paginatedClients = sortedClients.slice(skip, skip + limit);
      
      // Log sorting results for debugging
      if (filters.sortBy && filters.sortOrder) {
        console.log(`📊 Custom sorted results: ${sortedClients.length} clients sorted by ${filters.sortBy} ${filters.sortOrder}`);
      } else {
        const priorityWilayas = ['Tipaza', 'Alger', 'Algiers', 'Blida', 'Boumerdes'];
        const priorityCount = sortedClients.filter(c => 
          priorityWilayas.some(pw => pw.toLowerCase() === (c.wilaya || '').toLowerCase())
        ).length;
        console.log(`📊 Default sorted results: ${priorityCount} priority wilaya clients, ${sortedClients.length - priorityCount} other clients`);
      }
        
      // Use the actual count of filtered and sorted clients, not the raw MongoDB count
      // This fixes the pagination issue where filters show "no results" when clients exist on other pages
      const total = sortedClients.length;
      console.log(`🔢 Total clients after filtering and sorting: ${total}, Showing page ${page} with ${paginatedClients.length} clients`);
      
      // Process clients to add virtual fields
      const processedClients = paginatedClients.map(client => {
        const data = client.toObject({ virtuals: true });
        
        // Add creator name
        if (data.createdBy) {
          data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
        } else {
          data.creatorName = 'N/A';
        }
        
        // Add assigned to name
        if (data.assignedTo) {
          data.assignedToName = data.assignedTo.username || data.assignedTo.name || data.assignedTo.email || 'Unassigned';
        } else {
          data.assignedToName = 'Unassigned';
        }
        
        // Add validator name
        if (data.validatedBy) {
          data.validatorName = data.validatedBy.username || data.validatedBy.name || data.validatedBy.email || 'Unknown';
        } else {
          data.validatorName = 'N/A';
        }
        
        return data;
      });
      
      // Calculate statistics using all clients (before pagination)
      const stats = this.calculateStats(clients);
      
      const result = {
        clients: processedClients,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          limit
        },
        stats
      };

      // Cache the result for future requests
      await cacheService.setCachedClients(page, limit, filters, result);
      
      console.log('💾 Database result cached for future requests');
      return result;
    } catch (error) {
      throw new Error(`Failed to get suggested clients: ${error.message}`);
    }
  }

  async getSuggestedClientById(clientId) {
    try {
      // Check cache first
      const cacheResult = await cacheService.getCachedClient(clientId);
      if (cacheResult.success) {
        console.log(`🚀 Returning cached client: ${clientId}`);
        return cacheResult.data;
      }

      console.log(`🔍 Cache miss for client ${clientId} - fetching from database...`);
      
      const client = await SuggestedClient.findById(clientId)
        .populate('createdBy', 'username name email')
        .populate('assignedTo', 'username name email')
        .populate('validatedBy', 'username name email')
        .populate('callLogs.calledBy', 'username name email');
        
      if (!client) {
        throw new Error('Suggested client not found');
      }
      
      // Convert to object and add virtual fields
      const data = client.toObject({ virtuals: true });
      
      // Add names for display
      if (data.createdBy) {
        data.creatorName = data.createdBy.username || data.createdBy.name || data.createdBy.email || 'Unknown';
      } else {
        data.creatorName = 'N/A';
      }
      
      if (data.assignedTo) {
        data.assignedToName = data.assignedTo.username || data.assignedTo.name || data.assignedTo.email || 'Unassigned';
      } else {
        data.assignedToName = 'Unassigned';
      }
      
      if (data.validatedBy) {
        data.validatorName = data.validatedBy.username || data.validatedBy.name || data.validatedBy.email || 'Unknown';
      } else {
        data.validatorName = 'N/A';
      }
      
      // Cache the client data
      await cacheService.setCachedClient(clientId, data);
      console.log(`💾 Client ${clientId} cached for future requests`);
      
      return data;
    } catch (error) {
      throw new Error(`Failed to get suggested client: ${error.message}`);
    }
  }

  async updateSuggestedClient(clientId, updateData) {
    try {
      const client = await SuggestedClient.findByIdAndUpdate(
        clientId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'username name email')
        .populate('assignedTo', 'username name email')
        .populate('validatedBy', 'username name email');
        
      if (!client) {
        throw new Error('Suggested client not found');
      }
      
      // Invalidate cache since client data was updated
      await cacheService.invalidateClient(clientId);
      await cacheService.invalidateListsAndStats();
      console.log(`🗑️ Cache invalidated after updating client: ${clientId}`);
      
      return client;
    } catch (error) {
      throw new Error(`Failed to update suggested client: ${error.message}`);
    }
  }

  async deleteSuggestedClient(clientId) {
    try {
      const client = await SuggestedClient.findByIdAndUpdate(
        clientId,
        { status: 'deleted', updatedAt: Date.now() },
        { new: true }
      );
      
      if (!client) {
        throw new Error('Suggested client not found');
      }
      
      // Invalidate cache since client was deleted
      await cacheService.invalidateClient(clientId);
      await cacheService.invalidateListsAndStats();
      console.log(`🗑️ Cache invalidated after deleting client: ${clientId}`);
      
      return client;
    } catch (error) {
      throw new Error(`Failed to delete suggested client: ${error.message}`);
    }
  }

  async addCallLog(clientId, callLogData) {
    try {
      const client = await SuggestedClient.findById(clientId);
      
      if (!client) {
        throw new Error('Suggested client not found');
      }
      
      // Add call log to client
      await client.addCallLog(callLogData);
      
      // UPDATED: Increment call count for the user who made the call
      if (callLogData.calledBy) {
        try {
          const user = await User.findById(callLogData.calledBy);
          if (user && ['CLOSER', 'closer', 'employee'].includes(user.role)) {
            await user.incrementCallCount(callLogData.callDate || new Date());
            console.log(`📞 Call count incremented for user: ${user.username}, Total calls: ${user.callStats?.totalCalls || 0}`);
          }
        } catch (userError) {
          console.error('Error updating user call count:', userError.message);
          // Don't throw here - we don't want to fail the call log creation if user update fails
        }
      }
      
      // Return updated client with populated fields
      const updatedClient = await SuggestedClient.findById(clientId)
        .populate('createdBy', 'username name email')
        .populate('assignedTo', 'username name email')
        .populate('callLogs.calledBy', 'username name email');
      
      // Invalidate cache since call log was added
      await cacheService.invalidateClient(clientId);
      await cacheService.invalidateListsAndStats();
      console.log(`🗑️ Cache invalidated after adding call log to client: ${clientId}`);
      
      return updatedClient;
    } catch (error) {
      throw new Error(`Failed to add call log: ${error.message}`);
    }
  }

  async validateClient(clientId, isValid, validatorId, notes) {
    try {
      const client = await SuggestedClient.findById(clientId);
      
      if (!client) {
        throw new Error('Suggested client not found');
      }
      
      await client.validateClient(isValid, validatorId, notes);
      
      // Return updated client with populated fields
      const updatedClient = await SuggestedClient.findById(clientId)
        .populate('createdBy', 'username name email')
        .populate('assignedTo', 'username name email')
        .populate('validatedBy', 'username name email');
      
      // Invalidate cache since client validation status changed
      await cacheService.invalidateClient(clientId);
      await cacheService.invalidateListsAndStats();
      console.log(`🗑️ Cache invalidated after validating client: ${clientId}`);
      
      return updatedClient;
    } catch (error) {
      throw new Error(`Failed to validate client: ${error.message}`);
    }
  }

  async assignClient(clientId, assignedToId) {
    try {
      const client = await SuggestedClient.findByIdAndUpdate(
        clientId,
        { assignedTo: assignedToId, updatedAt: Date.now() },
        { new: true }
      )
        .populate('createdBy', 'username name email')
        .populate('assignedTo', 'username name email');
      
      if (!client) {
        throw new Error('Suggested client not found');
      }
      
      // Invalidate cache since client assignment changed
      await cacheService.invalidateClient(clientId);
      await cacheService.invalidateListsAndStats();
      console.log(`🗑️ Cache invalidated after assigning client: ${clientId}`);
      
      return client;
    } catch (error) {
      throw new Error(`Failed to assign client: ${error.message}`);
    }
  }

  async importSuggestedClients(clients, createdById) {
    try {
      const results = [];
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < clients.length; i++) {
        const clientData = clients[i];
        try {
          // Validate required fields
          if (!clientData.storeName || !clientData.storeAddress || !clientData.wilaya || !clientData.phoneNumber) {
            throw new Error('Missing required fields: storeName, storeAddress, wilaya, or phoneNumber');
          }
          
          const cleanedData = {
            ...clientData,
            createdBy: createdById
          };
          
          const client = await this.createSuggestedClient(cleanedData);
          
          results.push({
            success: true,
            index: i,
            suggestedClientId: client.suggestedClientId,
            id: client._id
          });
          
          successCount++;
        } catch (error) {
          results.push({
            success: false,
            index: i,
            storeName: clientData.storeName,
            error: error.message
          });
          
          failureCount++;
        }
      }
      
      return {
        totalProcessed: clients.length,
        successCount,
        failureCount,
        results
      };
    } catch (error) {
      throw new Error(`Failed to import suggested clients: ${error.message}`);
    }
  }

  async getStatistics(startDate, endDate) {
    try {
      const query = {};
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const clients = await SuggestedClient.find(query);
      
      return this.calculateStats(clients);
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  async getCallLogs(clientId, page = 1, limit = 10) {
    try {
      const client = await SuggestedClient.findById(clientId)
        .populate('callLogs.calledBy', 'username name email');
      
      if (!client) {
        throw new Error('Suggested client not found');
      }
      
      const skip = (page - 1) * limit;
      const callLogs = client.callLogs
        .sort((a, b) => new Date(b.callDate) - new Date(a.callDate))
        .slice(skip, skip + limit);
      
      return {
        callLogs,
        totalLogs: client.callLogs.length,
        currentPage: page,
        totalPages: Math.ceil(client.callLogs.length / limit)
      };
    } catch (error) {
      throw new Error(`Failed to get call logs: ${error.message}`);
    }
  }

  async deleteAllSuggestedClients() {
    try {
      const result = await SuggestedClient.deleteMany({});
      
      // Invalidate all cache since all clients were deleted
      await cacheService.invalidateAllClients();
      console.log('🗑️ All suggested clients cache invalidated after bulk delete');
      
      return {
        success: true,
        deletedCount: result.deletedCount || 0,
        message: `Successfully deleted ${result.deletedCount || 0} suggested clients from the database`
      };
    } catch (error) {
      throw new Error(`Failed to delete all suggested clients: ${error.message}`);
    }
  }

  // Helper method to calculate statistics
  calculateStats(clients) {
    const totalClients = clients.length;
    const pendingClients = clients.filter(c => c.status === 'pending').length;
    const contactedClients = clients.filter(c => c.status === 'contacted').length;
    const interestedClients = clients.filter(c => c.status === 'interested').length;
    const validatedClients = clients.filter(c => c.isValidated === true).length;
    const notInterestedClients = clients.filter(c => c.status === 'not_interested').length;
    const convertedClients = clients.filter(c => c.status === 'converted').length;
    
    // Calculate total calls
    const totalCalls = clients.reduce((sum, client) => sum + (client.totalCalls || 0), 0);
    
    // Calculate average calls per client
    const avgCallsPerClient = totalClients > 0 ? (totalCalls / totalClients).toFixed(2) : 0;
    
    // Calculate conversion rate
    const conversionRate = totalClients > 0 ? ((convertedClients / totalClients) * 100).toFixed(2) : 0;
    
    // Group by wilaya
    const wilayaStats = {};
    clients.forEach(client => {
      if (!wilayaStats[client.wilaya]) {
        wilayaStats[client.wilaya] = 0;
      }
      wilayaStats[client.wilaya]++;
    });
    
    // Group by priority
    const priorityStats = {};
    clients.forEach(client => {
      if (!priorityStats[client.priority]) {
        priorityStats[client.priority] = 0;
      }
      priorityStats[client.priority]++;
    });
    
    return {
      totalClients,
      pendingClients,
      contactedClients,
      interestedClients,
      validatedClients,
      notInterestedClients,
      convertedClients,
      totalCalls,
      avgCallsPerClient: parseFloat(avgCallsPerClient),
      conversionRate: parseFloat(conversionRate),
      wilayaStats,
      priorityStats
    };
  }

  // Get unique business types for filter dropdown
  async getUniqueBusinessTypes() {
    try {
      const businessTypes = await SuggestedClient.distinct('businessType', { 
        businessType: { $ne: null, $ne: '', $exists: true } 
      });
      
      // Filter out empty values and sort alphabetically
      const filteredTypes = businessTypes
        .filter(type => type && type.trim() !== '')
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      
      return filteredTypes;
    } catch (error) {
      throw new Error(`Failed to get unique business types: ${error.message}`);
    }
  }

  // Get unique wilayas for filter dropdown
  async getUniqueWilayas() {
    try {
      const wilayas = await SuggestedClient.distinct('wilaya', { 
        wilaya: { $ne: null, $ne: '', $exists: true } 
      });
      
      // Filter out empty values and sort alphabetically
      const filteredWilayas = wilayas
        .filter(wilaya => wilaya && wilaya.trim() !== '')
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      
      return filteredWilayas;
    } catch (error) {
      throw new Error(`Failed to get unique wilayas: ${error.message}`);
    }
  }
}