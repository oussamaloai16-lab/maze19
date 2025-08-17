import Service from '../models/Service.js';
import { validatePermissions } from '../middleware/authMiddleware.js';
import PERMISSIONS from '../config/rbac/permissions.js';
import { TaskService } from '../services/taskService.js';

// Create new service
export const createService = async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      createdBy: req.user._id
    };

    const service = await Service.create(serviceData);
    
    // Auto-create task for this service (non-blocking)
    setTimeout(async () => {
      try {
        const taskService = new TaskService();
        const task = await taskService.createTasksFromService(service._id);
        console.log(`Task created automatically for service ${service._id}:`, task._id);
      } catch (taskError) {
        console.error('Error creating task for service:', taskError.message);
        // Task creation failure doesn't affect service creation
      }
    }, 100); // Small delay to ensure service is fully created

    // Return service in the original format expected by frontend
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all services with filtering and pagination
export const getServices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) query.serviceStatus = status;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const services = await Service.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'username')
      .populate('assignedTo', 'username');

    const total = await Service.countDocuments(query);

    res.json({
      services,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get service statistics
export const getServiceStats = async (req, res) => {
  try {
    const [
      totalServices,
      activeServices,
      pendingServices,
      canceledServices,
      nameDistribution,
      monthlyTrends
    ] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ serviceStatus: 'Active' }),
      Service.countDocuments({ serviceStatus: 'Pending' }),
      Service.countDocuments({ serviceStatus: 'Canceled' }),
      Service.aggregate([
        {
          $group: {
            _id: '$serviceName',
            count: { $sum: 1 }
          }
        }
      ]),
      Service.aggregate([
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' },
              status: '$serviceStatus'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            '_id.year': -1,
            '_id.month': -1
          }
        }
      ])
    ]);

    // Calculate percentage changes
    const previousMonthDate = new Date();
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

    const [
      previousTotalServices,
      previousActiveServices,
      previousPendingServices,
      previousCanceledServices
    ] = await Promise.all([
      Service.countDocuments({ createdAt: { $lt: previousMonthDate } }),
      Service.countDocuments({ serviceStatus: 'Active', createdAt: { $lt: previousMonthDate } }),
      Service.countDocuments({ serviceStatus: 'Pending', createdAt: { $lt: previousMonthDate } }),
      Service.countDocuments({ serviceStatus: 'Canceled', createdAt: { $lt: previousMonthDate } })
    ]);

    // Format name distribution
    const formattedNameDistribution = nameDistribution.map(service => ({
      name: service._id,
      value: service.count
    }));

    // Format monthly trends
    const formattedMonthlyTrends = monthlyTrends.reduce((acc, curr) => {
      const date = new Date();
      date.setMonth(curr._id.month - 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      if (!acc[`${monthName} ${curr._id.year}`]) {
        acc[`${monthName} ${curr._id.year}`] = {
          name: monthName,
          active: 0,
          pending: 0
        };
      }
      
      if (curr._id.status === 'Active') {
        acc[`${monthName} ${curr._id.year}`].active = curr.count;
      } else if (curr._id.status === 'Pending') {
        acc[`${monthName} ${curr._id.year}`].pending = curr.count;
      }
      
      return acc;
    }, {});

    res.json({
      stats: {
        totalServices: {
          value: totalServices,
          change: previousTotalServices ? ((totalServices - previousTotalServices) / previousTotalServices) * 100 : 0
        },
        activeServices: {
          value: activeServices,
          change: previousActiveServices ? ((activeServices - previousActiveServices) / previousActiveServices) * 100 : 0
        },
        pendingServices: {
          value: pendingServices,
          change: previousPendingServices ? ((pendingServices - previousPendingServices) / previousPendingServices) * 100 : 0
        },
        canceledServices: {
          value: canceledServices,
          change: previousCanceledServices ? ((canceledServices - previousCanceledServices) / previousCanceledServices) * 100 : 0
        }
      },
      categoryDistribution: formattedNameDistribution,
      monthlyTrends: Object.values(formattedMonthlyTrends).slice(-6) // Last 6 months
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single service by ID
export const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('assignedTo', 'username');
      
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a service
export const updateService = async (req, res) => {
  try {
    // Check if user has permission to update services
    if (!validatePermissions(req.user, PERMISSIONS.SERVICES.UPDATE)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      service[key] = req.body[key];
    });

    await service.save();
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a service
export const deleteService = async (req, res) => {
  try {
    // Check if user has permission to delete services
    if (!validatePermissions(req.user, PERMISSIONS.SERVICES.DELETE)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await service.remove();
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign users to a service
export const assignUsers = async (req, res) => {
  try {
    // Check if user has permission to update services
    if (!validatePermissions(req.user, PERMISSIONS.SERVICES.UPDATE)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { userIds } = req.body;
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.assignedTo = userIds;
    await service.save();

    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update service status
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user._id;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check permissions based on status transition
    const hasPermission = await checkStatusTransitionPermission(req.user, service, status);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to make this status change' });
    }

    // Update status using the model method that handles history
    await service.updateStatus(status, userId, reason);

    // If status is changed to completed, notify relevant users
    if (status === 'completed') {
      await notifyServiceCompletion(service);
    }

    res.json({ 
      message: 'Service status updated successfully',
      service: await service.populate('statusHistory.changedBy', 'name email')
    });
  } catch (error) {
    if (error.message.includes('Invalid status transition')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating service status', error: error.message });
  }
};

/**
 * Get status history for a service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Return the status history array from the service document
    res.status(200).json({
      success: true,
      data: service.statusHistory || []
    });
  } catch (error) {
    console.error('Error fetching service status history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service status history'
    });
  }
};

// Helper function to check status transition permissions
const checkStatusTransitionPermission = async (user, service, newStatus) => {
  // SUPER_ADMIN can make any transition
  if (user.role === 'SUPER_ADMIN') return true;

  // CHEF_DE_BUREAU can make any transition except from/to cancelled
  if (user.role === 'CHEF_DE_BUREAU') {
    if (service.status === 'cancelled' || newStatus === 'cancelled') {
      return false;
    }
    return true;
  }

  // GRAPHIC_DESIGNER can only transition between in_progress and review
  if (user.role === 'GRAPHIC_DESIGNER') {
    const allowedTransitions = {
      'in_progress': ['review'],
      'review': ['in_progress']
    };
    return allowedTransitions[service.status]?.includes(newStatus);
  }

  return false;
};

// Helper function to notify users about service completion
const notifyServiceCompletion = async (service) => {
  // Implement notification logic here
  // This could involve sending emails, in-app notifications, etc.
  // You would typically call your notification service here
};

export default {
  createService,
  getServices,
  getServiceStats,
  getService,
  updateService,
  deleteService,
  assignUsers,
  updateStatus,
  getStatusHistory
}; 