// controllers/userController.js
import { UserService } from '../services/userService.js';

export class UserController {
  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req, res) => {
    try {
      const userData = req.body;
      const user = await this.userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  getUser = async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await this.userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  updateUser = async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      
      // Only allow users to update their own profile unless they're an admin
      if (userId !== req.user._id && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user'
        });
      }

      const user = await this.userService.updateUser(userId, updateData);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  updatePassword = async (req, res) => {
    try {
      const userId = req.user._id;
      const { oldPassword, newPassword } = req.body;

      const result = await this.userService.updatePassword(
        userId,
        oldPassword,
        newPassword
      );
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  updateRole = async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await this.userService.updateRole(
        userId,
        role,
        req.user._id
      );
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  getAllUsers = async (req, res) => {
    try {
      const { page, limit, ...filters } = req.query;
      
      const result = await this.userService.getAllUsers(
        filters,
        parseInt(page),
        parseInt(limit)
      );
      
      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Backend UserController
  deactivateUser = async (req, res) => {
    try {
      // Change from req.params.userId to req.params.id to match your route definition
      const userId = req.params.id;
      
      const result = await this.userService.deactivateUser(userId);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // In UserController class
  uploadAvatar = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      const userId = req.user._id;
      const avatarFile = req.file;
      
      const user = await this.userService.uploadAvatar(userId, avatarFile);
      
      res.status(200).json({
        success: true,
        data: {
          user,
          avatarUrl: user.avatar
        },
        message: 'Avatar uploaded successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  getProfile = async (req, res) => {
    try {
      const user = await this.userService.getUserById(req.user._id);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  getUsersByRole = async (req, res) => {
    try {
      const { role } = req.params;
      const { page, limit } = req.query;
      
      const result = await this.userService.getUsersByRole(
        role,
        parseInt(page) || 1,
        parseInt(limit) || 10
      );
      
      res.status(200).json({
        success: true,
        data: {
          users: result.users,
          pagination: result.pagination
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get current user's call statistics
  getCallStats = async (req, res) => {
    try {
      const userId = req.user._id;
      const callStats = await this.userService.getCallStats(userId);
      
      res.status(200).json({
        success: true,
        data: callStats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}