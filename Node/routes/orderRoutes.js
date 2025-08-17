// routes/orderRoutes.js
import express from 'express';
import { OrderController } from '../controllers/orderController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const orderController = new OrderController();

// Apply authentication to all routes
router.use(protect);

// Client routes
router.post('/',
  checkPermission('orders', 'create'),
  orderController.createOrder
);

router.get('/my-orders',
  checkPermission('orders', 'read'),
  orderController.getClientOrders
);

// Admin & Staff routes
router.get('/all',
  checkPermission('orders', 'read'),
  orderController.getAllOrders
);

router.patch('/:orderId/status',
  checkPermission('orders', 'update'),
  orderController.updateOrderStatus
);

// New route for order confirmation
router.post('/:orderId/confirm',
  checkPermission('orders', 'update'),
  orderController.confirmOrder
);

// Confirmation team routes
router.post('/:orderId/confirmation-attempt',
  checkPermission('orders', 'update'),
  orderController.logConfirmationAttempt
);

router.post('/:orderId/sync-zrexpress',
  checkPermission('orders', 'update'),
  orderController.syncOrderWithZRexpress
);

export default router;