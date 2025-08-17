import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import serviceController from '../controllers/serviceController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get service statistics
router.get('/stats', checkPermission('services', 'read'), serviceController.getServiceStats);

// Get all services with filtering and pagination
router.get('/', checkPermission('services', 'read'), serviceController.getServices);

// Create a new service
router.post('/', checkPermission('services', 'create'), serviceController.createService);

// Get a single service
router.get('/:id', checkPermission('services', 'read'), serviceController.getService);

// Update a service
router.put('/:id', checkPermission('services', 'update'), serviceController.updateService);

// Delete a service
router.delete('/:id', checkPermission('services', 'delete'), serviceController.deleteService);

// Assign users to a service
router.post('/:id/assign', checkPermission('services', 'update'), serviceController.assignUsers);

// Update service status
router.patch('/:id/status', checkPermission('services', 'update'), serviceController.updateStatus);

// Get status history for a service
router.get('/:id/status-history', checkPermission('services', 'read'), serviceController.getStatusHistory);

export default router;