import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import salaryService from '../services/salaryService';
import dailyReportService from '../services/dailyReportService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  UserPlus, 
  Users, 
  UserCheck, 
  Activity,
  Download,
  MoreHorizontal,
  Calendar,
  ChevronUp,
  ChevronDown,
  DollarSign
} from 'lucide-react';

const HomePage = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Sample data for charts
  const activityData = [
    { name: 'Mon', users: 20, orders: 15 },
    { name: 'Tue', users: 35, orders: 23 },
    { name: 'Wed', users: 45, orders: 30 },
    { name: 'Thu', users: 30, orders: 25 },
    { name: 'Fri', users: 55, orders: 40 },
    { name: 'Sat', users: 25, orders: 18 },
    { name: 'Sun', users: 15, orders: 10 },
  ];
  
  const monthlyData = [
    { name: 'Jan', users: 400, orders: 240 },
    { name: 'Feb', users: 300, orders: 200 },
    { name: 'Mar', users: 450, orders: 300 },
    { name: 'Apr', users: 380, orders: 265 },
    { name: 'May', users: 520, orders: 350 },
    { name: 'Jun', users: 580, orders: 390 },
  ];

  // Calculate salary based on daily reports
  const calculateSalary = (dailyReports, baseSalary = 35000) => {
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
    
    // Count submitted reports for current month
    const submittedReports = dailyReports.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate.getMonth() === currentMonth && 
             reportDate.getFullYear() === currentYear;
    }).length;
    
    // Calculate deductions (2000 DA per missing report)
    const missingReports = workingDays - submittedReports;
    const deductions = Math.max(0, missingReports * 2000);
    
    const finalSalary = baseSalary - deductions;
    
    return {
      baseSalary,
      deductions,
      finalSalary,
      submittedReports,
      workingDays,
      missingReports
    };
  };

  // Fetch salary data for current user
  const fetchSalaryData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get current user's salary data from the backend
      const salaryResponse = await salaryService.getCurrentUserSalary();
      
      if (salaryResponse.success) {
        setSalaryData(salaryResponse.data);
      } else {
        throw new Error('Failed to fetch salary data');
      }
    } catch (error) {
      console.error('Error fetching salary data:', error);
      setError('Failed to load salary data');
      // Set default salary data
      setSalaryData({
        baseSalary: 35000,
        deductions: 0,
        finalSalary: 35000,
        submittedReports: 0,
        workingDays: 22,
        missingReports: 22
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSalaryData();
    }
  }, [user]);
  
  const stats = [
    { title: 'Total Users', value: '1,234', change: 25.2, icon: <Users size={20} /> },
    { title: 'Active Users', value: '892', change: 18.2, icon: <UserCheck size={20} /> },
    { 
      title: 'Current Salary', 
      value: salaryData ? `${salaryData.finalSalary.toLocaleString()} DA` : 'Loading...', 
      change: salaryData ? (salaryData.deductions > 0 ? -11.4 : 0) : 0, 
      icon: <DollarSign size={20} />,
      isSalary: true
    },
    { title: 'User Retention', value: '85%', change: -1.2, icon: <Activity size={20} /> },
  ];

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            <Download size={18} />
            Export
          </button>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              <MoreHorizontal size={18} />
              More actions
            </button>
          </div>
        </div>
      </div>
      
      {/* Date Range Selector */}
      <div className="mb-6">
        <button className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700">
          <Calendar size={18} />
          Last 30 days
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
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
                <div className={`text-3xl font-semibold mt-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </div>
                {/* Show salary breakdown for the salary card */}
                {stat.isSalary && salaryData && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Base: {salaryData.baseSalary.toLocaleString()} DA
                    </div>
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      Deductions: -{salaryData.deductions.toLocaleString()} DA
                    </div>
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Reports: {salaryData.submittedReports}/{salaryData.workingDays}
                    </div>
                  </div>
                )}
              </div>
              <div className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-flex items-center text-sm ${
                stat.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.change >= 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {Math.abs(stat.change)}% last week
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Activity Chart */}
        <div className={`rounded-lg shadow ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="p-6">
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Weekly User Activity
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
                    opacity={theme === 'dark' ? 0.1 : 1}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                    tickLine={{ stroke: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                    tickLine={{ stroke: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                      border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="users"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Users"
                  />
                  <Bar
                    dataKey="orders"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Monthly Trends Chart */}
        <div className={`rounded-lg shadow ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="p-6">
            <h2 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Monthly Trends
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
                    opacity={theme === 'dark' ? 0.1 : 1}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                    tickLine={{ stroke: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                    tickLine={{ stroke: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1F2937' : 'white',
                      border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: theme === 'dark' ? '#1F2937' : 'white' }}
                    activeDot={{ r: 6 }}
                    name="Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: theme === 'dark' ? '#1F2937' : 'white' }}
                    activeDot={{ r: 6 }}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className={`rounded-lg shadow ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-6">
          <h2 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Recent Activity
          </h2>
          <div className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="py-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {item % 2 === 0 ? <UserPlus size={18} /> : <UserCheck size={18} />}
                  </div>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {item % 2 === 0 ? 'New user registered' : 'User confirmed account'}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item} hour{item !== 1 ? 's' : ''} ago
                    </p>
                  </div>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item % 2 === 0 
                      ? (theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
                      : (theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800')
                  }`}>
                    {item % 2 === 0 ? 'New' : 'Update'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;