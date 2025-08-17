// routes/dailyReportsRoutes.js
import express from 'express';
import { DailyReportsController } from '../controllers/dailyReportsController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const dailyReportsController = new DailyReportsController();

// Apply authentication to all routes
router.use(protect);

// Daily summary endpoints
router.get('/summary',
  checkPermission('reports', 'read'),
  dailyReportsController.getDailySummary
);

router.get('/weekly',
  checkPermission('reports', 'read'),
  dailyReportsController.getWeeklySummary
);

router.get('/monthly',
  checkPermission('reports', 'read'),
  dailyReportsController.getMonthlySummary
);

// Telegram notification endpoints
router.post('/send-telegram-summary',
  checkPermission('reports', 'create'),
  dailyReportsController.sendDailySummaryTelegram
);

// NEW: Closers report endpoints
router.get('/closers',
  checkPermission('reports', 'read'),
  dailyReportsController.getClosersReport
);

router.get('/closers/quick-summary',
  checkPermission('reports', 'read'),
  dailyReportsController.getClosersQuickSummary
);

router.post('/send-closers-telegram',
  checkPermission('reports', 'create'),
  dailyReportsController.sendClosersReportTelegram
);

// NEW: Employee daily reports summary endpoint
router.post('/send-employee-reports-telegram',
  checkPermission('reports', 'create'),
  dailyReportsController.sendDailyEmployeeReportsTelegram
);

// Employee Daily Report endpoints
router.post('/employee/submit',
  dailyReportsController.submitEmployeeDailyReport
);

router.get('/employee/my-today',
  dailyReportsController.getMyTodayReport
);

router.get('/employee/all',
  checkPermission('reports', 'read'),
  dailyReportsController.getEmployeeDailyReports
);

router.get('/:reportId',
  dailyReportsController.getReportById
);

export default router;