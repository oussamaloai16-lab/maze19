import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import reportController from '../controllers/reportController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all reports with filtering and pagination
router.get('/', 
  checkPermission('reports', 'read'), 
  reportController.getAllReports
);

// Get report statistics
router.get('/stats', 
  checkPermission('reports', 'read'), 
  reportController.getReportStats
);

// Get reports by date range
router.get('/date-range', 
  checkPermission('reports', 'read'), 
  reportController.getReportsByDateRange
);

// Get a single report
router.get('/:id', 
  checkPermission('reports', 'read'), 
  reportController.getReport
);

// Create a new report manually
router.post('/', 
  checkPermission('reports', 'create'), 
  reportController.createReport
);

// Update a report
router.put('/:id', 
  checkPermission('reports', 'update'), 
  reportController.updateReport
);

// Archive multiple reports
router.patch('/archive', 
  checkPermission('reports', 'update'), 
  reportController.archiveReports
);

// Delete a report
router.delete('/:id', 
  checkPermission('reports', 'delete'), 
  reportController.deleteReport
);

export default router; 