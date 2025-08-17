// routes/transactionRoutes.js
import express from 'express';
import { TransactionController } from '../controllers/transactionController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const transactionController = new TransactionController();

// Apply authentication to all routes
router.use(protect);

// Client routes
router.get('/my-transactions',
  checkPermission('transactions', 'read'),
  transactionController.getClientTransactions
);

// Admin & Accountant routes
router.post('/',
  checkPermission('transactions', 'create'),
  transactionController.createTransaction
);

router.get('/all',
  checkPermission('transactions', 'read'),
  transactionController.getAllTransactions
);

router.get('/statistics',
  checkPermission('transactions', 'read'),
  transactionController.getTransactionStatistics
);

router.post('/import',
  checkPermission('transactions', 'create'),
  transactionController.importTransactions
);

// New route for deleting all transactions
router.delete('/delete-all',
  checkPermission('transactions', 'delete'),
  transactionController.deleteAllTransactions
);

router.get('/order/:orderId',
  checkPermission('transactions', 'read'),
  transactionController.getTransactionsByOrder
);

router.get('/external/:externalId',
  checkPermission('transactions', 'read'),
  transactionController.getTransactionByExternalId
);

router.get('/:transactionId',
  checkPermission('transactions', 'read'),
  transactionController.getTransactionById
);

router.patch('/:transactionId',
  checkPermission('transactions', 'update'),
  transactionController.updateTransaction
);

router.delete('/:transactionId',
  checkPermission('transactions', 'delete'),
  transactionController.deleteTransaction
);

export default router;