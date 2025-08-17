// routes/suggestedClientRoutes.js
import express from 'express';
import { SuggestedClientController } from '../controllers/suggestedClientController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const suggestedClientController = new SuggestedClientController();

// Apply authentication to all routes
router.use(protect);

// Main CRUD routes
router.post('/',
  checkPermission('suggested_clients', 'create'),
  suggestedClientController.createSuggestedClient
);

router.get('/all',
  checkPermission('suggested_clients', 'read'),
  suggestedClientController.getAllSuggestedClients
);

router.get('/statistics',
  checkPermission('suggested_clients', 'read'),
  suggestedClientController.getStatistics
);

router.get('/business-types',
  checkPermission('suggested_clients', 'read'),
  suggestedClientController.getUniqueBusinessTypes
);

router.get('/wilayas',
  checkPermission('suggested_clients', 'read'),
  suggestedClientController.getUniqueWilayas
);

router.post('/import',
  checkPermission('suggested_clients', 'create'),
  suggestedClientController.importSuggestedClients
);

// Delete all suggested clients (with confirmation)
router.delete('/delete-all',
  checkPermission('suggested_clients', 'delete'),
  suggestedClientController.deleteAllSuggestedClients
);

// Individual client routes
router.get('/:clientId',
  checkPermission('suggested_clients', 'read'),
  suggestedClientController.getSuggestedClientById
);

router.patch('/:clientId',
  checkPermission('suggested_clients', 'update'),
  suggestedClientController.updateSuggestedClient
);

router.delete('/:clientId',
  checkPermission('suggested_clients', 'delete'),
  suggestedClientController.deleteSuggestedClient
);

// Call management routes
router.post('/:clientId/call-logs',
  checkPermission('suggested_clients', 'call'),
  suggestedClientController.addCallLog
);

router.get('/:clientId/call-logs',
  checkPermission('suggested_clients', 'read'),
  suggestedClientController.getCallLogs
);

// Validation routes
router.patch('/:clientId/validate',
  checkPermission('suggested_clients', 'validate'),
  suggestedClientController.validateClient
);

// Assignment routes
router.patch('/:clientId/assign',
  checkPermission('suggested_clients', 'update'),
  suggestedClientController.assignClient
);

// Cache management routes (Admin only)
router.get('/cache/stats',
  checkPermission('suggested_clients', 'read'),
  suggestedClientController.getCacheStats
);

router.post('/cache/clear',
  checkPermission('suggested_clients', 'delete'), // Use delete permission for cache clearing
  suggestedClientController.clearCache
);

router.post('/cache/warm-up',
  checkPermission('suggested_clients', 'read'),
  suggestedClientController.warmUpCache
);

export default router;