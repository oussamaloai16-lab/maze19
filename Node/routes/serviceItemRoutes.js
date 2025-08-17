import express from 'express';
import { ServiceItemController } from '../controllers/serviceItemController.js';
import protect from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';

const router = express.Router();
const serviceItemController = new ServiceItemController();

// All routes are protected
router.use(protect);

// Routes for service items
router.post('/', checkPermission('services', 'create'), serviceItemController.createServiceItem);
router.get('/', checkPermission('services', 'read'), serviceItemController.getAllServiceItems);
router.get('/:id', checkPermission('services', 'read'), serviceItemController.getServiceItemById);
router.patch('/:id', checkPermission('services', 'update'), serviceItemController.updateServiceItem);
router.delete('/:id', checkPermission('services', 'delete'), serviceItemController.deleteServiceItem);

export default router; 