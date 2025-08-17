// controllers/suggestedClientController.js
import { SuggestedClientService } from '../services/suggestedClientService.js';
import cacheService from '../services/cacheService.js';

export class SuggestedClientController {
  constructor() {
    this.suggestedClientService = new SuggestedClientService();
  }

  createSuggestedClient = async (req, res) => {
    try {
      const clientData = {
        ...req.body,
        createdBy: req.user._id
      };

      const client = await this.suggestedClientService.createSuggestedClient(clientData);
      
      res.status(201).json({
        success: true,
        data: client
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getSuggestedClientById = async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await this.suggestedClientService.getSuggestedClientById(clientId);
      
      res.status(200).json({
        success: true,
        data: client
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  getAllSuggestedClients = async (req, res) => {
    try {
      const { page, limit, status, wilaya, priority, assignedTo, search, createdBy, startDate, endDate, leadCollectionsMode, scoreRange, isValidated, scoreMin, businessType, sortBy, sortOrder, callBackLater } = req.query;
      
      // Build filters object
      const filters = {};
      if (status) filters.status = status;
      if (wilaya) filters.wilaya = wilaya;
      if (priority) filters.priority = priority;
      if (assignedTo) filters.assignedTo = assignedTo;
      if (createdBy) filters.createdBy = createdBy;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (scoreRange) filters.scoreRange = scoreRange;
      if (isValidated !== undefined) filters.isValidated = isValidated === 'true';
      if (scoreMin !== undefined) filters.scoreMin = parseInt(scoreMin);
      if (businessType) filters.businessType = businessType;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;
      if (callBackLater) filters.callBackLater = callBackLater === 'true';
      if (search) {
        filters.$or = [
          { storeName: { $regex: search, $options: 'i' } },
          { storeAddress: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { suggestedClientId: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Role-based filtering: Only apply for Lead Collections mode
      if (leadCollectionsMode === 'true' && req.user.role !== 'SUPER_ADMIN') {
        console.log(`Lead Collections mode: Applying role-based filter for user ${req.user._id} with role ${req.user.role}`);
        filters.createdBy = req.user._id;
      } else if (leadCollectionsMode === 'true') {
        console.log(`Lead Collections mode: SUPER_ADMIN access for user ${req.user._id}`);
      } else {
        console.log(`Suggested Clients mode: Normal access for user ${req.user._id} with role ${req.user.role}`);
      }
      
      const result = await this.suggestedClientService.getAllSuggestedClients(
        parseInt(page) || 1,
        parseInt(limit) || 25,
        filters
      );
      
      res.status(200).json({
        success: true,
        data: {
          clients: result.clients,
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

  updateSuggestedClient = async (req, res) => {
    try {
      const { clientId } = req.params;
      const updateData = req.body;
      
      const client = await this.suggestedClientService.updateSuggestedClient(
        clientId,
        updateData
      );
      
      res.status(200).json({
        success: true,
        data: client
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  deleteSuggestedClient = async (req, res) => {
    try {
      const { clientId } = req.params;
      
      const client = await this.suggestedClientService.deleteSuggestedClient(clientId);
      
      res.status(200).json({
        success: true,
        data: client,
        message: 'Suggested client deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add call log to a suggested client
  addCallLog = async (req, res) => {
    try {
      const { clientId } = req.params;
      const callLogData = {
        ...req.body,
        calledBy: req.user._id
      };
      
      const client = await this.suggestedClientService.addCallLog(clientId, callLogData);
      
      res.status(200).json({
        success: true,
        data: client,
        message: 'Call log added successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Validate or invalidate a suggested client
  validateClient = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { isValid, notes } = req.body;
      
      const client = await this.suggestedClientService.validateClient(
        clientId,
        isValid,
        req.user._id,
        notes
      );
      
      res.status(200).json({
        success: true,
        data: client,
        message: `Client ${isValid ? 'validated' : 'invalidated'} successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Assign client to a team member
  assignClient = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { assignedTo } = req.body;
      
      const client = await this.suggestedClientService.assignClient(clientId, assignedTo);
      
      res.status(200).json({
        success: true,
        data: client,
        message: 'Client assigned successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Import multiple suggested clients
  importSuggestedClients = async (req, res) => {
    try {
      const { clients } = req.body;
      
      if (!clients || !Array.isArray(clients) || clients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or empty clients array'
        });
      }
      
      const result = await this.suggestedClientService.importSuggestedClients(
        clients,
        req.user._id
      );
      
      res.status(200).json({
        success: result.successCount > 0,
        message: `Successfully imported ${result.successCount} of ${clients.length} suggested clients`,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get statistics for suggested clients
  getStatistics = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const statistics = await this.suggestedClientService.getStatistics(
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

  // Get call logs for a specific client
  getCallLogs = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { page, limit } = req.query;
      
      const result = await this.suggestedClientService.getCallLogs(
        clientId,
        parseInt(page) || 1,
        parseInt(limit) || 10
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete all suggested clients (with confirmation)
  deleteAllSuggestedClients = async (req, res) => {
    try {
      const { confirmationToken } = req.body;
      
      if (confirmationToken !== 'DELETE_ALL_SUGGESTED_CLIENTS_CONFIRM') {
        return res.status(400).json({
          success: false,
          message: 'Confirmation token required to delete all suggested clients'
        });
      }
      
      const result = await this.suggestedClientService.deleteAllSuggestedClients();
      
      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully deleted ${result.deletedCount} suggested clients`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get unique business types for filter dropdown
  getUniqueBusinessTypes = async (req, res) => {
    try {
      const businessTypes = await this.suggestedClientService.getUniqueBusinessTypes();
      
      res.status(200).json({
        success: true,
        data: businessTypes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get unique wilayas for filter dropdown
  getUniqueWilayas = async (req, res) => {
    try {
      const wilayas = await this.suggestedClientService.getUniqueWilayas();
      
      res.status(200).json({
        success: true,
        data: wilayas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Cache management endpoints
  getCacheStats = async (req, res) => {
    try {
      const stats = await cacheService.getCacheStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  clearCache = async (req, res) => {
    try {
      const { type } = req.body; // 'all', 'lists', 'clients', or 'stats'
      
      let cleared = 0;
      if (type === 'all') {
        cleared = await cacheService.invalidateAllClients();
      } else if (type === 'lists') {
        cleared = await cacheService.invalidateListsAndStats();
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid cache type. Use "all" or "lists"'
        });
      }
      
      res.status(200).json({
        success: true,
        message: `Successfully cleared ${cleared} cache entries`,
        data: { clearedCount: cleared }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  warmUpCache = async (req, res) => {
    try {
      // This would trigger pre-caching of common queries
      const commonQueries = await cacheService.warmUpCache();
      
      // For now, just return the queries that would be cached
      res.status(200).json({
        success: true,
        message: 'Cache warm-up initiated',
        data: {
          queriesCount: commonQueries.length,
          queries: commonQueries
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}