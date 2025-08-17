// routes/paymentRoutes.js
import express from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const paymentController = new PaymentController();

router.use(protect);

// Client routes
router.post('/', 
  checkPermission('payments', 'create'),
  paymentController.createPayment
);

router.get('/my-payments', 
  checkPermission('payments', 'read'),
  paymentController.getClientPayments
);

// Admin & accountant routes
router.get('/all', 
  checkPermission('payments', 'read'),
  paymentController.getAllPayments
);

router.patch('/:paymentId/approve', 
  checkPermission('payments', 'update'),
  paymentController.approvePayment
);

export default router;