// routes/creditRoutes.js
import express from 'express';
import { CreditController } from '../controllers/creditController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const creditController = new CreditController();

// Apply authentication to all routes
router.use(protect);

// Get current user's credit status
router.get('/status', creditController.getCreditStatus);

// Reveal phone number (deducts credit)
router.post('/reveal-phone/:clientId', 
  checkPermission('suggested_clients', 'read'),
  creditController.revealPhoneNumber
);

// Get credit history for current user
router.get('/history', creditController.getCreditHistory);

// Get credit history for specific user (admin only)
router.get('/history/:userId',
  checkPermission('users', 'read'),
  creditController.getCreditHistory
);

// Admin routes
router.post('/add',
  checkPermission('users', 'update'),
  creditController.addCredits
);

router.get('/all-closers',
  checkPermission('users', 'read'),
  creditController.getAllClosersCredits
);

// Migration endpoint - initialize credits for existing closers
router.post('/initialize',
  checkPermission('users', 'update'),
  creditController.initializeCreditsForClosers
);

export default router;