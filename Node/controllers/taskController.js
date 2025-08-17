// controllers/taskController.js
import Task from '../models/taskModel.js';
import { TaskService } from '../services/taskService.js';

export class TaskController {
  constructor() {
    this.taskService = new TaskService();
  }

  // Create task manually
  createTask = async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        createdBy: req.user._id
      };
      const task = await this.taskService.createTask(taskData);
      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create tasks automatically from service
  createTasksFromService = async (req, res) => {
    try {
      const { serviceId } = req.body;
      const task = await this.taskService.createTasksFromService(serviceId);
      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created from service successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all tasks with filters and pagination
  getAllTasks = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        assignedTo, 
        taskType, 
        clientId, 
        priority, 
        isUrgent, 
        isBlocked,
        search,
        dueDateFrom,
        dueDateTo,
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;

      const filters = {
        ...(status && { status }),
        ...(assignedTo && { assignedTo }),
        ...(taskType && { taskType }),
        ...(clientId && { clientId }),
        ...(priority && { priority }),
        ...(isUrgent !== undefined && { isUrgent: isUrgent === 'true' }),
        ...(isBlocked !== undefined && { isBlocked: isBlocked === 'true' }),
        ...(search && { search }),
        ...(dueDateFrom && { dueDateFrom }),
        ...(dueDateTo && { dueDateTo })
      };

      const tasks = await this.taskService.getAllTasks(filters, page, limit, sortBy, sortOrder);
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get tasks assigned to current user
  getMyTasks = async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const filters = { assignedTo: req.user._id };
      if (status) filters.status = status;

      const tasks = await this.taskService.getAllTasks(filters, page, limit);
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get tasks by user (for managers)
  getUserTasks = async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const filters = { assignedTo: userId };
      if (status) filters.status = status;

      const tasks = await this.taskService.getAllTasks(filters, page, limit);
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get single task by ID
  getTaskById = async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = await this.taskService.getTaskById(taskId);
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update task status
  updateTaskStatus = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { status, reason = '', timeTaken = 0 } = req.body;
      const task = await this.taskService.updateTaskStatus(taskId, status, req.user._id, reason, timeTaken);
      res.status(200).json({
        success: true,
        data: task,
        message: 'Task status updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Assign task to user
  assignTask = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { assignedTo } = req.body;
      const task = await this.taskService.assignTask(taskId, assignedTo, req.user._id);
      res.status(200).json({
        success: true,
        data: task,
        message: 'Task assigned successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update task progress
  updateProgress = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { progress } = req.body;
      const task = await this.taskService.updateProgress(taskId, progress, req.user._id);
      res.status(200).json({
        success: true,
        data: task,
        message: 'Task progress updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add comment to task
  addComment = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { content, isInternal = false } = req.body;
      const task = await this.taskService.addComment(taskId, content, req.user._id, isInternal);
      res.status(200).json({
        success: true,
        data: task,
        message: 'Comment added successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add revision note
  addRevisionNote = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { note } = req.body;
      const task = await this.taskService.addRevisionNote(taskId, note, req.user._id);
      res.status(200).json({
        success: true,
        data: task,
        message: 'Revision note added successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Upload attachment
  uploadAttachment = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { filename, url } = req.body;
      const task = await this.taskService.addAttachment(taskId, filename, url, req.user._id);
      res.status(200).json({
        success: true,
        data: task,
        message: 'Attachment uploaded successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Upload deliverable
  uploadDeliverable = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { filename, url, version = 1 } = req.body;
      const task = await this.taskService.addDeliverable(taskId, filename, url, req.user._id, version);
      res.status(200).json({
        success: true,
        data: task,
        message: 'Deliverable uploaded successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get task statistics
  getTaskStats = async (req, res) => {
    try {
      const { assignedTo, clientId, dateFrom, dateTo } = req.query;
      const filters = {
        ...(assignedTo && { assignedTo }),
        ...(clientId && { clientId }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      };

      const stats = await this.taskService.getTaskStats(filters);
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

  // Get tasks for dashboard/kanban view
  getTasksKanban = async (req, res) => {
    try {
      const { assignedTo, clientId } = req.query;
      const filters = {
        ...(assignedTo && { assignedTo }),
        ...(clientId && { clientId })
      };

      // Get tasks grouped by status
      const statuses = ['pending', 'in-progress', 'review', 'completed', 'delivered'];
      const kanbanData = {};

      for (const status of statuses) {
        const statusFilters = { ...filters, status };
        const result = await this.taskService.getAllTasks(statusFilters, 1, 100, 'dueDate', 'asc');
        kanbanData[status] = result.tasks; // Access the tasks array from the result
      }

      res.status(200).json({
        success: true,
        data: kanbanData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update task (general update)
  updateTask = async (req, res) => {
    try {
      const { taskId } = req.params;
      const updateData = req.body;
      
      const task = await Task.findByIdAndUpdate(
        taskId, 
        { 
          ...updateData, 
          updatedAt: new Date() 
        }, 
        { new: true }
      ).populate('assignedTo', 'username email role')
       .populate('clientId', 'username email')
       .populate('serviceId', 'serviceName brandName');

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.status(200).json({
        success: true,
        data: task,
        message: 'Task updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete task
  deleteTask = async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = await Task.findByIdAndDelete(taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Block/Unblock task
  toggleTaskBlock = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { isBlocked, blockReason = '' } = req.body;
      
      const task = await Task.findByIdAndUpdate(
        taskId,
        { 
          isBlocked,
          blockReason: isBlocked ? blockReason : '',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.status(200).json({
        success: true,
        data: task,
        message: `Task ${isBlocked ? 'blocked' : 'unblocked'} successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mark task as urgent/not urgent
  toggleTaskUrgency = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { isUrgent } = req.body;
      
      const task = await Task.findByIdAndUpdate(
        taskId,
        { 
          isUrgent,
          priority: isUrgent ? 'urgent' : 'medium',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.status(200).json({
        success: true,
        data: task,
        message: `Task marked as ${isUrgent ? 'urgent' : 'normal priority'}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Legacy methods for backward compatibility
  getDesignerTasks = async (req, res) => {
    return this.getMyTasks(req, res);
  }

  uploadTaskFile = async (req, res) => {
    return this.uploadDeliverable(req, res);
  }
}