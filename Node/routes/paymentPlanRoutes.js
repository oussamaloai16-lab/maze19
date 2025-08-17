// routes/paymentPlanRoutes.js
import express from 'express';
import { PaymentPlanController } from '../controllers/paymentPlanController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const paymentPlanController = new PaymentPlanController();

router.use(protect);

// Public routes (still requires authentication)
router.get('/active', 
  checkPermission('payment_plans', 'read'),
  paymentPlanController.getActivePlans
);

// Super admin routes
router.post('/', 
  checkPermission('payment_plans', 'create'),
  paymentPlanController.createPaymentPlan
);

router.patch('/:planId', 
  checkPermission('payment_plans', 'update'),
  paymentPlanController.updatePaymentPlan
);

router.patch('/:planId/deactivate', 
  checkPermission('payment_plans', 'update'),
  paymentPlanController.deactivatePlan
);

export default router;