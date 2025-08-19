// services/taskService.js
import Task from '../models/taskModel.js';
import Service from '../models/Service.js';
import User from '../models/userModel.js';

export class TaskService {
  // Remove constructor - no notification service needed
  
  // Service to Task Type Mapping
  getTaskTypeFromService(serviceName) {
    const serviceTaskMap = {
      'Professional Photography - Product Shooting': 'PHOTOGRAPHY_PRODUCT',
      'Professional Photography - Brand Shooting': 'PHOTOGRAPHY_BRAND',
      'Professional Photography - Studio Shooting': 'PHOTOGRAPHY_STUDIO',
      'Professional Photography - Outdoor Shooting': 'PHOTOGRAPHY_OUTDOOR',
      'Video Production - Product Demo Videos': 'VIDEO_PRODUCT_DEMO',
      'Video Production - Brand Story Videos': 'VIDEO_BRAND_STORY',
      'Video Production - Social Media Content': 'VIDEO_SOCIAL_MEDIA',
      'Video Production - Promotional Videos': 'VIDEO_PROMOTIONAL',
      'Video Production - Customer Testimonials': 'VIDEO_TESTIMONIALS',
      'Advertising Management - Facebook Ads': 'ADVERTISING_FACEBOOK',
      'Advertising Management - Instagram Ads': 'ADVERTISING_INSTAGRAM',
      'Advertising Management - Google Ads': 'ADVERTISING_GOOGLE',
      'Social Media Management - Content Creation': 'SOCIAL_MEDIA_CONTENT',
      'Social Media Management - Daily Posting': 'SOCIAL_MEDIA_POSTING',
      'Social Media Management - Community Management': 'SOCIAL_MEDIA_MANAGEMENT',
      'E-commerce Development - Online Store Creation': 'ECOMMERCE_DEVELOPMENT',
      'E-commerce Development - Product Catalog Setup': 'ECOMMERCE_CATALOG',
      'E-commerce Development - Payment Integration': 'ECOMMERCE_PAYMENT',
      'Order Fulfillment - Order Processing': 'ORDER_FULFILLMENT',
      'Order Fulfillment - Inventory Management': 'INVENTORY_MANAGEMENT',
      'Order Fulfillment - Delivery Coordination': 'DELIVERY_COORDINATION',
      'Creative Design - Brand Identity': 'CREATIVE_DESIGN',
      'Creative Design - Logo Design': 'LOGO_DESIGN',
      'Creative Design - Graphic Design': 'GRAPHIC_DESIGN',
      'Creative Design - Marketing Materials': 'MARKETING_MATERIALS'
    };

    return serviceTaskMap[serviceName] || 'OTHER';
  }

  // Auto-assign tasks based on type and user roles
  async getOptimalAssignee(taskType) {
    try {
      const roleMap = {
        'PHOTOGRAPHY_PRODUCT': ['PHOTOGRAPHER', 'CREATIVE_TEAM'],
        'PHOTOGRAPHY_BRAND': ['PHOTOGRAPHER', 'CREATIVE_TEAM'],
        'PHOTOGRAPHY_STUDIO': ['PHOTOGRAPHER', 'CREATIVE_TEAM'],
        'PHOTOGRAPHY_OUTDOOR': ['PHOTOGRAPHER', 'CREATIVE_TEAM'],
        'VIDEO_PRODUCT_DEMO': ['VIDEO_EDITOR', 'CREATIVE_TEAM'],
        'VIDEO_BRAND_STORY': ['VIDEO_EDITOR', 'CREATIVE_TEAM'],
        'VIDEO_SOCIAL_MEDIA': ['VIDEO_EDITOR', 'SOCIAL_MEDIA_MANAGER'],
        'VIDEO_PROMOTIONAL': ['VIDEO_EDITOR', 'CREATIVE_TEAM'],
        'VIDEO_TESTIMONIALS': ['VIDEO_EDITOR', 'CREATIVE_TEAM'],
        'ADVERTISING_FACEBOOK': ['ADS_MANAGER', 'MARKETING_TEAM'],
        'ADVERTISING_INSTAGRAM': ['ADS_MANAGER', 'MARKETING_TEAM'],
        'ADVERTISING_GOOGLE': ['ADS_MANAGER', 'MARKETING_TEAM'],
        'SOCIAL_MEDIA_CONTENT': ['SOCIAL_MEDIA_MANAGER', 'CREATIVE_TEAM'],
        'SOCIAL_MEDIA_POSTING': ['SOCIAL_MEDIA_MANAGER'],
        'SOCIAL_MEDIA_MANAGEMENT': ['SOCIAL_MEDIA_MANAGER'],
        'ECOMMERCE_DEVELOPMENT': ['DEVELOPER', 'TECH_TEAM'],
        'ECOMMERCE_CATALOG': ['DEVELOPER', 'TECH_TEAM'],
        'ECOMMERCE_PAYMENT': ['DEVELOPER', 'TECH_TEAM'],
        'ORDER_FULFILLMENT': ['FULFILLMENT_SPECIALIST', 'OPERATIONS_TEAM'],
        'INVENTORY_MANAGEMENT': ['INVENTORY_MANAGER', 'OPERATIONS_TEAM'],
        'DELIVERY_COORDINATION': ['LOGISTICS_COORDINATOR', 'OPERATIONS_TEAM'],
        'CREATIVE_DESIGN': ['GRAPHIC_DESIGNER', 'CREATIVE_TEAM'],
        'LOGO_DESIGN': ['GRAPHIC_DESIGNER', 'CREATIVE_TEAM'],
        'GRAPHIC_DESIGN': ['GRAPHIC_DESIGNER', 'CREATIVE_TEAM'],
        'MARKETING_MATERIALS': ['GRAPHIC_DESIGNER', 'MARKETING_TEAM']
      };

      const preferredRoles = roleMap[taskType] || ['EMPLOYEE'];
      
      // Find users with matching roles, prioritize by current workload
      const users = await User.find({ 
        role: { $in: preferredRoles },
        isActive: true 
      });

      if (users.length === 0) {
        return null;
      }

      // Get current task counts for load balancing
      const userWorkloads = await Promise.all(
        users.map(async (user) => {
          const taskCount = await Task.countDocuments({
            assignedTo: user._id,
            status: { $in: ['pending', 'in-progress', 'review'] }
          });
          return { user, taskCount };
        })
      );

      // Sort by workload and return user with least tasks
      userWorkloads.sort((a, b) => a.taskCount - b.taskCount);
      return userWorkloads[0].user._id;
    } catch (error) {
      console.error('Error finding optimal assignee:', error);
      return null;
    }
  }

  // Create tasks automatically from service
  async createTasksFromService(serviceId) {
    try {
      const service = await Service.findById(serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      const taskType = this.getTaskTypeFromService(service.serviceName);
      const assignedTo = await this.getOptimalAssignee(taskType);

      // Calculate estimated hours based on task type
      const estimatedHours = this.getEstimatedHours(taskType);
      
      // Set due date (default 7 days from start date)
      const dueDate = new Date(service.estimatedStartDate || Date.now());
      dueDate.setDate(dueDate.getDate() + 7);

      const taskData = {
        title: `${service.serviceName} - ${service.brandName}`,
        description: `${service.serviceDescription || 'Complete ' + service.serviceName + ' for ' + service.brandName}\n\nProject: ${service.projectName}\nGoal: ${service.goalExpectations}\nTarget Audience: ${service.targetAudience}`,
        taskType,
        serviceId: service._id,
        clientId: service.createdBy,
        assignedTo,
        estimatedHours,
        dueDate,
        priority: service.budget > 5000 ? 'high' : 'medium',
        createdBy: service.createdBy
      };

      const task = await this.createTask(taskData);
      
      return task;
    } catch (error) {
      throw new Error(`Error creating tasks from service: ${error.message}`);
    }
  }

  getEstimatedHours(taskType) {
    const hoursMap = {
      'PHOTOGRAPHY_PRODUCT': 4,
      'PHOTOGRAPHY_BRAND': 6,
      'PHOTOGRAPHY_STUDIO': 8,
      'PHOTOGRAPHY_OUTDOOR': 10,
      'VIDEO_PRODUCT_DEMO': 12,
      'VIDEO_BRAND_STORY': 16,
      'VIDEO_SOCIAL_MEDIA': 8,
      'VIDEO_PROMOTIONAL': 20,
      'VIDEO_TESTIMONIALS': 10,
      'ADVERTISING_FACEBOOK': 6,
      'ADVERTISING_INSTAGRAM': 6,
      'ADVERTISING_GOOGLE': 8,
      'SOCIAL_MEDIA_CONTENT': 4,
      'SOCIAL_MEDIA_POSTING': 2,
      'SOCIAL_MEDIA_MANAGEMENT': 40,
      'ECOMMERCE_DEVELOPMENT': 80,
      'ECOMMERCE_CATALOG': 16,
      'ECOMMERCE_PAYMENT': 12,
      'ORDER_FULFILLMENT': 4,
      'INVENTORY_MANAGEMENT': 8,
      'DELIVERY_COORDINATION': 6,
      'CREATIVE_DESIGN': 12,
      'LOGO_DESIGN': 8,
      'GRAPHIC_DESIGN': 6,
      'MARKETING_MATERIALS': 10
    };

    return hoursMap[taskType] || 8;
  }

  async createTask(taskData) {
    try {
      const task = new Task({
        ...taskData,
        statusHistory: [{
          status: 'pending',
          changedBy: taskData.createdBy,
          reason: 'Task created',
          timestamp: new Date()
        }]
      });
      
      await task.save();
      
      return await Task.findById(task._id)
        .populate('assignedTo', 'username email')
        .populate('clientId', 'username email')
        .populate('serviceId', 'serviceName brandName')
        .populate('createdBy', 'username email');
    } catch (error) {
      throw new Error(`Error creating task: ${error.message}`);
    }
  }

  async getAllTasks(filters = {}, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc') {
    try {
      const query = {};
      
      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.assignedTo) query.assignedTo = filters.assignedTo;
      if (filters.taskType) query.taskType = filters.taskType;
      if (filters.clientId) query.clientId = filters.clientId;
      if (filters.priority) query.priority = filters.priority;
      if (filters.isUrgent !== undefined) query.isUrgent = filters.isUrgent;
      if (filters.isBlocked !== undefined) query.isBlocked = filters.isBlocked;
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }
      if (filters.dueDateFrom || filters.dueDateTo) {
        query.dueDate = {};
        if (filters.dueDateFrom) query.dueDate.$gte = new Date(filters.dueDateFrom);
        if (filters.dueDateTo) query.dueDate.$lte = new Date(filters.dueDateTo);
      }

      const skip = (page - 1) * limit;
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const tasks = await Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedTo', 'username email role')
        .populate('clientId', 'username email')
        .populate('serviceId', 'serviceName brandName')
        .populate('createdBy', 'username email')
        .populate('comments.author', 'username')
        .populate('revisionNotes.requestedBy', 'username')
        .populate('statusHistory.changedBy', 'username');

      const total = await Task.countDocuments(query);

      return {
        tasks,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching tasks: ${error.message}`);
    }
  }

  async getTaskById(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'username email role')
        .populate('clientId', 'username email')
        .populate('serviceId', 'serviceName brandName budget')
        .populate('createdBy', 'username email')
        .populate('comments.author', 'username email')
        .populate('revisionNotes.requestedBy', 'username email')
        .populate('statusHistory.changedBy', 'username email')
        .populate('attachments.uploadedBy', 'username')
        .populate('deliverables.uploadedBy', 'username');

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    } catch (error) {
      throw new Error(`Error fetching task: ${error.message}`);
    }
  }

  async updateTaskStatus(taskId, status, userId, reason = '', timeTaken = 0) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const oldStatus = task.status;
      task.status = status;

      // Update timeline fields
      const now = new Date();
      if (status === 'in-progress' && !task.startedAt) {
        task.startedAt = now;
        task.progress = 10; // Starting progress
      }
      
      if (status === 'review') {
        task.progress = 80;
      }
      
      if (status === 'completed') {
        task.completedAt = now;
        task.progress = 100;
        if (timeTaken) task.actualHours = timeTaken;
      }
      
      if (status === 'delivered') {
        task.deliveredAt = now;
        task.progress = 100;
      }

      // Add to status history
      task.statusHistory.push({
        status,
        changedBy: userId,
        reason,
        timestamp: now
      });

      await task.save();
      
      return await this.getTaskById(taskId);
    } catch (error) {
      throw new Error(`Error updating task status: ${error.message}`);
    }
  }

  async assignTask(taskId, assignedTo, assignedBy) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const oldAssignee = task.assignedTo;
      task.assignedTo = assignedTo;

      // Add to status history
      task.statusHistory.push({
        status: task.status,
        changedBy: assignedBy,
        reason: `Task reassigned`,
        timestamp: new Date()
      });

      await task.save();
      
      return await this.getTaskById(taskId);
    } catch (error) {
      throw new Error(`Error assigning task: ${error.message}`);
    }
  }

  async addComment(taskId, content, authorId, isInternal = false) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      task.comments.push({
        content,
        author: authorId,
        isInternal,
        createdAt: new Date()
      });

      await task.save();
      
      return await this.getTaskById(taskId);
    } catch (error) {
      throw new Error(`Error adding comment: ${error.message}`);
    }
  }

  async addRevisionNote(taskId, note, requestedBy) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      task.revisionNotes.push({
        note,
        requestedBy,
        createdAt: new Date(),
        resolved: false
      });

      // Update status to pending if not already
      if (task.status === 'completed' || task.status === 'review') {
        task.status = 'in-progress';
        task.progress = Math.max(50, task.progress - 20); // Reduce progress for revisions
      }

      await task.save();
      return await this.getTaskById(taskId);
    } catch (error) {
      throw new Error(`Error adding revision note: ${error.message}`);
    }
  }

  async updateProgress(taskId, progress, userId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      task.progress = Math.max(0, Math.min(100, progress));
      
      // Auto-update status based on progress
      if (progress >= 100 && task.status !== 'completed' && task.status !== 'delivered') {
        task.status = 'review';
      } else if (progress > 0 && task.status === 'pending') {
        task.status = 'in-progress';
        task.startedAt = task.startedAt || new Date();
      }

      await task.save();
      return await this.getTaskById(taskId);
    } catch (error) {
      throw new Error(`Error updating progress: ${error.message}`);
    }
  }

  async addAttachment(taskId, filename, url, uploadedBy) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      task.attachments.push({
        filename,
        url,
        uploadedBy,
        uploadedAt: new Date()
      });

      await task.save();
      return await this.getTaskById(taskId);
    } catch (error) {
      throw new Error(`Error adding attachment: ${error.message}`);
    }
  }

  async addDeliverable(taskId, filename, url, uploadedBy, version = 1) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      task.deliverables.push({
        filename,
        url,
        version,
        uploadedBy,
        uploadedAt: new Date()
      });

      // Auto-update status to review if deliverable is added
      if (task.status === 'in-progress') {
        task.status = 'review';
        task.progress = Math.max(80, task.progress);
      }

      await task.save();
      return await this.getTaskById(taskId);
    } catch (error) {
      throw new Error(`Error adding deliverable: ${error.message}`);
    }
  }

  async getTaskStats(filters = {}) {
    try {
      const query = {};
      if (filters.assignedTo) query.assignedTo = filters.assignedTo;
      if (filters.clientId) query.clientId = filters.clientId;
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const stats = await Task.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
            review: { $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            avgProgress: { $avg: '$progress' },
            totalEstimatedHours: { $sum: '$estimatedHours' },
            totalActualHours: { $sum: '$actualHours' }
          }
        }
      ]);

      const tasksByType = await Task.aggregate([
        { $match: query },
        { $group: { _id: '$taskType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const tasksByPriority = await Task.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);

      return {
        overview: stats[0] || {
          total: 0, pending: 0, inProgress: 0, review: 0, 
          completed: 0, delivered: 0, cancelled: 0,
          avgProgress: 0, totalEstimatedHours: 0, totalActualHours: 0
        },
        byType: tasksByType,
        byPriority: tasksByPriority
      };
    } catch (error) {
      throw new Error(`Error fetching task stats: ${error.message}`);
    }
  }

  // Legacy methods for backward compatibility
  async getDesignerTasks(designerId, page = 1, limit = 10, status) {
    const filters = { assignedTo: designerId };
    if (status) filters.status = status;
    return await this.getAllTasks(filters, page, limit);
  }

  async addTaskFile(taskId, fileUrl) {
    // This is now handled by addDeliverable or addAttachment
    return await this.addDeliverable(taskId, 'uploaded-file', fileUrl, null);
  }
}