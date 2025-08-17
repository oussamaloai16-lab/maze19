import Report from '../models/reportModel.js';
import { validatePermissions } from '../middleware/authMiddleware.js';
import PERMISSIONS from '../config/rbac/permissions.js';

export class ReportController {
  
  // Get all reports with filtering and pagination
  getAllReports = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 25, 
        type, 
        status,
        startDate,
        endDate,
        search,
        isAutomated,
        sortBy = 'reportDate',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query = {};
      
      if (type) query.type = type;
      if (status) query.status = status;
      if (isAutomated !== undefined) query.isAutomated = isAutomated === 'true';
      
      if (startDate && endDate) {
        query.reportDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (search) {
        query.$text = { $search: search };
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const reports = await Report.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('generatedBy', 'username name email')
        .lean();

      const total = await Report.countDocuments(query);

      res.json({
        success: true,
        reports,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching reports',
        error: error.message 
      });
    }
  };

  // Get a single report by ID
  getReport = async (req, res) => {
    try {
      const { id } = req.params;
      
      const report = await Report.findById(id)
        .populate('generatedBy', 'username name email')
        .lean();
        
      if (!report) {
        return res.status(404).json({ 
          success: false,
          message: 'Report not found' 
        });
      }
      
      res.json({
        success: true,
        report
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching report',
        error: error.message 
      });
    }
  };

  // Get report statistics
  getReportStats = async (req, res) => {
    try {
      const { period = '30' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Get basic statistics
      const totalReports = await Report.countDocuments({
        reportDate: { $gte: startDate, $lte: endDate }
      });

      const successfulReports = await Report.countDocuments({
        reportDate: { $gte: startDate, $lte: endDate },
        'telegramInfo.sent': true
      });

      const failedReports = await Report.countDocuments({
        reportDate: { $gte: startDate, $lte: endDate },
        status: 'failed'
      });

      const automatedReports = await Report.countDocuments({
        reportDate: { $gte: startDate, $lte: endDate },
        isAutomated: true
      });

      // Get reports by type
      const reportsByType = await Report.aggregate([
        {
          $match: {
            reportDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            successfulSends: {
              $sum: {
                $cond: ['$telegramInfo.sent', 1, 0]
              }
            }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Get daily report trends
      const dailyTrends = await Report.aggregate([
        {
          $match: {
            reportDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$reportDate" }
            },
            count: { $sum: 1 },
            successfulSends: {
              $sum: {
                $cond: ['$telegramInfo.sent', 1, 0]
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Get recent reports
      const recentReports = await Report.find({
        reportDate: { $gte: startDate, $lte: endDate }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('generatedBy', 'username name')
        .lean();

      res.json({
        success: true,
        stats: {
          total: totalReports,
          successful: successfulReports,
          failed: failedReports,
          automated: automatedReports,
          successRate: totalReports > 0 ? Math.round((successfulReports / totalReports) * 100) : 0
        },
        reportsByType,
        dailyTrends,
        recentReports,
        period: parseInt(period)
      });
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching report statistics',
        error: error.message 
      });
    }
  };

  // Create a new report manually
  createReport = async (req, res) => {
    try {
      // Check permissions
      if (!validatePermissions(req.user, PERMISSIONS.REPORTS.CREATE)) {
        return res.status(403).json({ 
          success: false,
          message: 'Permission denied' 
        });
      }

      const reportData = {
        ...req.body,
        generatedBy: req.user._id,
        isAutomated: false
      };

      const report = new Report(reportData);
      await report.save();

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        report
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(400).json({ 
        success: false,
        message: 'Error creating report',
        error: error.message 
      });
    }
  };

  // Update a report
  updateReport = async (req, res) => {
    try {
      // Check permissions
      if (!validatePermissions(req.user, PERMISSIONS.REPORTS.UPDATE)) {
        return res.status(403).json({ 
          success: false,
          message: 'Permission denied' 
        });
      }

      const { id } = req.params;
      const report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ 
          success: false,
          message: 'Report not found' 
        });
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          report[key] = req.body[key];
        }
      });

      await report.save();
      
      res.json({
        success: true,
        message: 'Report updated successfully',
        report
      });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(400).json({ 
        success: false,
        message: 'Error updating report',
        error: error.message 
      });
    }
  };

  // Delete a report
  deleteReport = async (req, res) => {
    try {
      // Check permissions
      if (!validatePermissions(req.user, PERMISSIONS.REPORTS.DELETE)) {
        return res.status(403).json({ 
          success: false,
          message: 'Permission denied' 
        });
      }

      const { id } = req.params;
      const report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ 
          success: false,
          message: 'Report not found' 
        });
      }

      await Report.findByIdAndDelete(id);
      
      res.json({
        success: true,
        message: 'Report deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error deleting report',
        error: error.message 
      });
    }
  };

  // Archive multiple reports
  archiveReports = async (req, res) => {
    try {
      // Check permissions
      if (!validatePermissions(req.user, PERMISSIONS.REPORTS.UPDATE)) {
        return res.status(403).json({ 
          success: false,
          message: 'Permission denied' 
        });
      }

      const { reportIds } = req.body;
      
      if (!reportIds || !Array.isArray(reportIds)) {
        return res.status(400).json({ 
          success: false,
          message: 'Report IDs array is required' 
        });
      }

      const result = await Report.updateMany(
        { _id: { $in: reportIds } },
        { status: 'archived' }
      );

      res.json({
        success: true,
        message: `${result.modifiedCount} reports archived successfully`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Error archiving reports:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error archiving reports',
        error: error.message 
      });
    }
  };

  // Get reports by date range
  getReportsByDateRange = async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false,
          message: 'Start date and end date are required' 
        });
      }

      const reports = await Report.getReportsByDateRange(startDate, endDate, type);
      
      res.json({
        success: true,
        reports,
        count: reports.length
      });
    } catch (error) {
      console.error('Error fetching reports by date range:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching reports by date range',
        error: error.message 
      });
    }
  };
}

export default new ReportController(); 