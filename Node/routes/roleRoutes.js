// routes/roleRoutes.js
import express from 'express';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';
import { UserService } from '../services/userService.js';

const router = express.Router();
const userService = new UserService();

// Protect all role routes
router.use(protect);

// Get all available roles
router.get('/',
  checkPermission('users', 'read'),
  async (req, res) => {
    try {
      // Get roles from RBAC configuration
      const roles = Object.keys(ROLES).map(role => ({
        name: role,
        permissions: ROLES[role].permissions
      }));

      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get role details with permissions
router.get('/:roleName',
  checkPermission('users', 'read'),
  async (req, res) => {
    try {
      const { roleName } = req.params;
      const role = ROLES[roleName];

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          name: roleName,
          ...role
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Assign role to user
router.patch('/assign/:userId',
  checkPermission('users', 'update'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!ROLES[role]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      const updatedUser = await userService.updateRole(userId, role, req.user._id);

      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get users by role
router.get('/users/:roleName',
  checkPermission('users', 'read'),
  async (req, res) => {
    try {
      const { roleName } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await userService.getAllUsers(
        { role: roleName },
        parseInt(page),
        parseInt(limit)
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
);

export default router;