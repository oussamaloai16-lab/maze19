import express from 'express';
import User from '../models/userModel.js';
import DailyReport from '../models/dailyReportModel.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current user's salary data
router.get('/current-user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get working days in current month (excluding weekends)
    const getWorkingDaysInMonth = (year, month) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let workingDays = 0;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        // Sunday = 0, Saturday = 6, exclude weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++;
        }
      }
      return workingDays;
    };
    
    const workingDays = getWorkingDaysInMonth(currentYear, currentMonth);
    const baseSalary = req.user.baseSalary || 35000;
    
    // Get daily reports for current month
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    
    const dailyReports = await DailyReport.find({
      userId: userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: 1 });
    
    const submittedReports = dailyReports.length;
    const missingReports = Math.max(0, workingDays - submittedReports);

    // SUPER_ADMIN: no deductions
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const deductions = isSuperAdmin ? 0 : (missingReports * 2000);
    const finalSalary = Math.max(0, baseSalary - deductions);
    
    res.json({
      success: true,
      data: {
        baseSalary,
        deductions,
        finalSalary,
        submittedReports,
        workingDays,
        missingReports,
        dailyReports: dailyReports
      }
    });
  } catch (error) {
    console.error('Error fetching current user salary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary data'
    });
  }
});

// Get all employees
router.get('/users/employees', authMiddleware, async (req, res) => {
  try {
    const employees = await User.find({ 
      role: { $ne: 'SUPER_ADMIN' } 
    }).select('username name email role position department baseSalary');
    
    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    });
  }
});

// Get daily reports for an employee
router.get('/daily-reports/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query;
    
    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const dailyReports = await DailyReport.find({
      userId: employeeId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: 1 });
    
    res.json({
      success: true,
      data: dailyReports
    });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily reports'
    });
  }
});

// Get check-ins for an employee (placeholder - you'll need to create a check-in model)
router.get('/checkins/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query;
    
    // For now, return empty array since we don't have a check-in model
    // You'll need to create a CheckIn model and implement this properly
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch check-ins'
    });
  }
});

// Calculate salary for an employee
router.post('/salary/calculate', authMiddleware, async (req, res) => {
  try {
    const { employeeId, month } = req.body;
    
    const user = await User.findById(employeeId).select('baseSalary role');
    const baseSalary = user?.baseSalary ?? 35000;
    const workingDays = 22;
    
    // Get daily reports
    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const dailyReports = await DailyReport.find({
      userId: employeeId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    const submittedReports = dailyReports.length;
    const missingReports = Math.max(0, workingDays - submittedReports);
    const reportDeduction = (user?.role === 'SUPER_ADMIN') ? 0 : (missingReports * 2000);
    
    // For now, assume no late check-ins since we don't have check-in data
    const lateCheckinDeduction = 0;
    
    const totalDeductions = reportDeduction + lateCheckinDeduction;
    const finalSalary = Math.max(0, baseSalary - totalDeductions);
    
    res.json({
      success: true,
      data: {
        baseSalary,
        submittedReports,
        missingReports,
        reportDeduction,
        lateCheckinDeduction,
        totalDeductions,
        finalSalary
      }
    });
  } catch (error) {
    console.error('Error calculating salary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate salary'
    });
  }
});

export default router; 