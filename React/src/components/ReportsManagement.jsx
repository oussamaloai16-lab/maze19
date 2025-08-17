import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  FileText,
  Download,
  MoreHorizontal,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Send,
  Archive,
  Eye,
  RefreshCw
} from 'lucide-react';
import reportService from '../services/reportService';
import dailyReportService from '../services/dailyReportService';
import ReportViewModal from './ReportViewModal';
import { toast } from 'react-toastify';

const ReportsManagement = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Data states
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0
  });
  const [allReports, setAllReports] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    reportType: '',
    status: ''
  });

  // Add missing variables
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const [reportsByType, setReportsByType] = useState([
    { name: 'Daily Reports', count: 0 },
    { name: 'Weekly Reports', count: 0 },
    { name: 'Monthly Reports', count: 0 },
    { name: 'Telegram Reports', count: 0 }
  ]);

  // Check if user can view all reports or just their own
  const canViewAllReports = ['SUPER_ADMIN', 'CHEF_DE_BUREAU', 'ACCOUNTANT'].includes(user?.role);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, searchTerm, selectedPeriod, currentPage, filters]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // For employee daily reports, use the specialized API
      const reportParams = {
        page: currentPage,
        limit: itemsPerPage
      };

      // Add filters
      if (activeTab !== 'all') {
        reportParams.status = activeTab;
      }
      if (searchTerm) {
        reportParams.search = searchTerm;
      }
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          reportParams[key] = filters[key];
        }
      });

      // Use employee daily reports API
      const reportsData = await dailyReportService.getAllEmployeeReports(reportParams);
      setAllReports(reportsData.data.reports);
      setCurrentPage(reportsData.data.pagination.page);
      setTotalPages(reportsData.data.pagination.pages);
      setTotalItems(reportsData.data.pagination.total);
      
      // Calculate stats from reports
      const stats = {
        total: reportsData.data.pagination.total,
        successful: reportsData.data.reports.filter(r => r.telegramInfo?.sent).length,
        failed: reportsData.data.reports.filter(r => r.status === 'failed').length,
        pending: reportsData.data.reports.filter(r => r.status === 'generated').length
      };
      setStats(stats);
      
      // Calculate reports by type
      const reports = reportsData.data.reports;
      const typeStats = [
        { name: 'Daily Reports', count: reports.filter(r => r.type === 'employee_daily_report').length },
        { name: 'Weekly Reports', count: reports.filter(r => r.type === 'weekly_report').length },
        { name: 'Monthly Reports', count: reports.filter(r => r.type === 'monthly_report').length },
        { name: 'Telegram Reports', count: reports.filter(r => r.telegramInfo?.sent).length }
      ];
      setReportsByType(typeStats);
      
      // Generate sample daily trends data
      const trends = [
        { _id: 'Mon', count: Math.floor(Math.random() * 20) + 5, successfulSends: Math.floor(Math.random() * 15) + 3 },
        { _id: 'Tue', count: Math.floor(Math.random() * 20) + 5, successfulSends: Math.floor(Math.random() * 15) + 3 },
        { _id: 'Wed', count: Math.floor(Math.random() * 20) + 5, successfulSends: Math.floor(Math.random() * 15) + 3 },
        { _id: 'Thu', count: Math.floor(Math.random() * 20) + 5, successfulSends: Math.floor(Math.random() * 15) + 3 },
        { _id: 'Fri', count: Math.floor(Math.random() * 20) + 5, successfulSends: Math.floor(Math.random() * 15) + 3 },
        { _id: 'Sat', count: Math.floor(Math.random() * 20) + 5, successfulSends: Math.floor(Math.random() * 15) + 3 },
        { _id: 'Sun', count: Math.floor(Math.random() * 20) + 5, successfulSends: Math.floor(Math.random() * 15) + 3 }
      ];
      setDailyTrends(trends);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error.message || 'Failed to load report data');
      toast.error(error.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchReportData();
  };

  const handleViewReport = async (reportId) => {
    setModalLoading(true);
    setShowViewModal(true);
    
    try {
      const response = await dailyReportService.getReportById(reportId);
      setSelectedReport(response.data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error(error.message || 'Failed to load report details');
      setShowViewModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedReport(null);
  };

  const handleArchiveReports = async (reportIds) => {
    try {
      await reportService.archiveReports(reportIds);
      toast.success(`${reportIds.length} report(s) archived successfully`);
      fetchReportData();
    } catch (error) {
      toast.error('Failed to archive reports');
    }
  };

  const getStatusBadge = (status) => {
    let bgColor, textColor, icon;
    
    if (theme === 'dark') {
      switch (status) {
        case 'sent':
          bgColor = 'bg-green-900/30';
          textColor = 'text-green-400';
          icon = <CheckCircle className="w-4 h-4" />;
          break;
        case 'failed':
          bgColor = 'bg-red-900/30';
          textColor = 'text-red-400';
          icon = <XCircle className="w-4 h-4" />;
          break;
        case 'generated':
          bgColor = 'bg-blue-900/30';
          textColor = 'text-blue-400';
          icon = <Clock className="w-4 h-4" />;
          break;
        case 'archived':
          bgColor = 'bg-gray-900/30';
          textColor = 'text-gray-400';
          icon = <Archive className="w-4 h-4" />;
          break;
        default:
          bgColor = 'bg-gray-900/30';
          textColor = 'text-gray-400';
          icon = <AlertCircle className="w-4 h-4" />;
      }
    } else {
      switch (status) {
        case 'sent':
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          icon = <CheckCircle className="w-4 h-4" />;
          break;
        case 'failed':
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          icon = <XCircle className="w-4 h-4" />;
          break;
        case 'generated':
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-800';
          icon = <Clock className="w-4 h-4" />;
          break;
        case 'archived':
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
          icon = <Archive className="w-4 h-4" />;
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
          icon = <AlertCircle className="w-4 h-4" />;
      }
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Reports Management</h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Telegram reports and analytics dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded border ${
              theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className={`flex items-center gap-2 px-4 py-2 rounded border ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}>
            <Download size={18} />
            Export
          </button>
          <div className="relative">
            <button className={`flex items-center gap-2 px-4 py-2 rounded border ${
              theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}>
              <MoreHorizontal size={18} />
              More actions
            </button>
          </div>
        </div>
      </div>
      
      {/* Period Selector */}
      <div className="mb-6 flex items-center gap-4">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className={`px-4 py-2 rounded border ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-700'
          }`}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded border ${
              theme === 'dark' 
                ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400' 
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>
      
      {error && (
        <div className={`p-4 mb-6 rounded-lg ${
          theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
            theme === 'dark' 
              ? 'border-blue-500 border-t-transparent' 
              : 'border-blue-600 border-t-transparent'
          }`} />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { 
                title: 'Total Reports', 
                value: stats.total, 
                icon: <FileText size={20} />,
                color: 'blue'
              },
              { 
                title: 'Successfully Sent', 
                value: stats.successful, 
                icon: <Send size={20} />,
                color: 'green'
              },
              { 
                title: 'Failed Reports', 
                value: stats.failed, 
                icon: <XCircle size={20} />,
                color: 'red'
              },
              { 
                title: 'Pending Reports', 
                value: stats.pending, 
                icon: <Clock size={20} />,
                color: 'yellow'
              },
              { 
                title: 'Success Rate', 
                value: `${stats.successful / stats.total * 100}%`, 
                icon: <TrendingUp size={20} />,
                color: 'purple'
              }
            ].map((stat, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg shadow ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {stat.title}
                    </h3>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`text-${stat.color}-500`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Reports by Type Chart */}
            <div className={`rounded-lg shadow ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <h2 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Reports by Type
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reportsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Daily Trends Chart */}
            <div className={`rounded-lg shadow ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <h2 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Daily Report Trends
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Total Reports"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="successfulSends" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Successful Sends"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className={`rounded-lg shadow ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Reports
                </h2>
                
                {/* Status Filter Tabs */}
                <div className="flex gap-2">
                  {['all', 'sent', 'failed', 'generated', 'archived'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        activeTab === tab
                          ? theme === 'dark'
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-200 text-gray-800'
                          : theme === 'dark'
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {canViewAllReports && <th className="text-left py-3 px-4">Employee</th>}
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Summary</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Telegram</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {allReports.map((report) => (
                      <tr key={report._id} className={
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }>
                        {canViewAllReports && (
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                                {report.employeeInfo?.employeeName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span className="font-medium">
                                {report.employeeInfo?.employeeName || 'Unknown'}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {report.employeeInfo?.employeeRole || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">{formatDate(report.reportDate)}</td>
                        <td className="py-4 px-4 max-w-xs">
                          <div className="truncate">
                            {report.summary || report.content?.substring(0, 50) + '...' || 'No summary'}
                          </div>
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(report.status)}</td>
                        <td className="py-4 px-4">
                          {report.telegramInfo?.sent ? (
                            <span className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                              ✓ Sent
                            </span>
                          ) : (
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Not sent
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => handleViewReport(report._id)}
                            className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                            }`}
                          >
                            <Eye size={16} className="inline mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded ${
                        currentPage === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Previous
                    </button>
                    <span className={`px-3 py-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded ${
                        currentPage === totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <ReportViewModal
        isOpen={showViewModal}
        onClose={closeViewModal}
        report={selectedReport}
        loading={modalLoading}
      />
    </div>
  );
};

export default ReportsManagement; 