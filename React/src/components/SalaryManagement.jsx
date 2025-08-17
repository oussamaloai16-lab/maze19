import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import {
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import salaryService from '../services/salaryService';

const SalaryManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filters, setFilters] = useState({
    search: '',
    department: ''
  });

  // No mock data - only real data from database

  useEffect(() => {
    fetchSalaryData();
  }, [selectedMonth]);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      
      // Fetch real employees from the database
      const employeesResponse = await salaryService.getEmployees();
      const employeesData = employeesResponse?.data || employeesResponse || [];
      
      // Process each employee to get their salary data
      const processedEmployees = await Promise.all(
        employeesData.map(async (employee) => {
          try {
            // Get daily reports for this employee
            const dailyReportsResp = await salaryService.getDailyReports(employee._id, selectedMonth);
            const dailyReports = dailyReportsResp?.data || dailyReportsResp || [];
            
            // Get check-in data for this employee
            const checkinsResp = await salaryService.getCheckins(employee._id, selectedMonth);
            const checkinsData = checkinsResp?.data || checkinsResp || [];
            
            // Calculate working days in the month (assuming 22 working days)
            const workingDays = 22;
            
            // Count daily reports submitted
            const submittedReports = dailyReports.length || 0;
            
            // Count late check-ins (after 10am on Sun-Thu)
            const lateCheckins = checkinsData.filter(checkin => {
              const checkinDate = new Date(checkin.checkinTime);
              const dayOfWeek = checkinDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
              const hour = checkinDate.getHours();
              
              // Check if it's Sunday-Thursday (0-4) and after 10am
              return (dayOfWeek >= 0 && dayOfWeek <= 4) && hour >= 10;
            }).length;
            
            return {
              
              id: employee._id,
              name: employee.username || employee.name || 'Unknown Employee',
              role: employee.role,
              position: employee.position || employee.role || 'Employee',
              department: employee.department || 'General',
              isCloser: employee.role === 'CLOSER' || employee.role === 'closer',
              baseSalary: typeof employee.baseSalary === 'number' ? employee.baseSalary : 35000,
              dailyReports: submittedReports,
              checkins: checkinsData.length || 0,
              lateCheckins: lateCheckins
            };
          } catch (error) {
            console.error(`Error processing employee ${employee._id}:`, error);
            // Return default data if there's an error
            return {
              id: employee._id,
              name: employee.username || employee.name,
              role: employee.role,
              position: employee.position || 'Employee',
              department: employee.department || 'General',
              isCloser: employee.role === 'CLOSER' || employee.role === 'closer',
              baseSalary: typeof employee.baseSalary === 'number' ? employee.baseSalary : 35000,
              dailyReports: 0,
              checkins: 0,
              lateCheckins: 0
            };
          }
        })
      );
      
      setEmployees(processedEmployees);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast.error('Failed to load salary data');
      // No fallback - only real data
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalary = (employee) => {
    const baseSalary = employee.baseSalary;
    const workingDays = 22; // Assuming 22 working days per month

    // SUPER_ADMIN: no deductions
    if (employee.role === 'SUPER_ADMIN') {
      return {
        baseSalary,
        reportDeduction: 0,
        lateCheckinDeduction: 0,
        totalDeductions: 0,
        finalSalary: baseSalary
      };
    }
    
    // Calculate daily report deductions
    const missingReports = workingDays - employee.dailyReports;
    const reportDeduction = missingReports * 2000;
    
    // Calculate check-in deductions
    const lateCheckinDeduction = employee.lateCheckins * 1000;
    
    const totalDeductions = reportDeduction + lateCheckinDeduction;
    const finalSalary = baseSalary - totalDeductions;
    
    return {
      baseSalary,
      reportDeduction,
      lateCheckinDeduction,
      totalDeductions,
      finalSalary
    };
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const EmployeeCard = ({ employee }) => {
    const salary = calculateSalary(employee);
    const reportPercentage = (employee.dailyReports / 22) * 100;
    const checkinPercentage = ((22 - employee.lateCheckins) / 22) * 100;

    return (
      <div className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">
                {employee.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {employee.name}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {employee.position} • {employee.department}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-xs font-medium rounded ${
              theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
            }`}>
              Your Salary: {salary.finalSalary.toLocaleString()} DA
            </span>
            {employee.isCloser && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                CLOSER
              </span>
            )}
          </div>
        </div>

        {/* Salary Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Base Salary
              </span>
              <span className={`font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {salary.baseSalary.toLocaleString()} DA
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Final Salary
              </span>
              <span className={`font-bold text-lg ${
                salary.finalSalary >= salary.baseSalary ? 'text-green-600' : 'text-red-600'
              }`}>
                {salary.finalSalary.toLocaleString()} DA
              </span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        {(salary.reportDeduction > 0 || salary.lateCheckinDeduction > 0) && (
          <div className={`p-4 rounded-lg mb-4 ${
            theme === 'dark' ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-semibold mb-3 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-700'
            }`}>
              Deductions
            </h4>
            <div className="space-y-2">
              {salary.reportDeduction > 0 && (
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Missing Daily Reports ({(22 - employee.dailyReports)} days)
                  </span>
                  <span className="font-bold text-red-600">
                    -{salary.reportDeduction.toLocaleString()} DA
                  </span>
                </div>
              )}
              {salary.lateCheckinDeduction > 0 && (
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Late Check-ins ({employee.lateCheckins} times)
                  </span>
                  <span className="font-bold text-red-600">
                    -{salary.lateCheckinDeduction.toLocaleString()} DA
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Daily Reports
              </span>
              <span className={`text-xs font-bold ${getStatusColor(reportPercentage)}`}>
                {employee.dailyReports}/22
              </span>
            </div>
            <div className={`w-full h-2 bg-gray-200 rounded-full ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${reportPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                On-time Check-ins
              </span>
              <span className={`text-xs font-bold ${getStatusColor(checkinPercentage)}`}>
                {(22 - employee.lateCheckins)}/22
              </span>
            </div>
            <div className={`w-full h-2 bg-gray-200 rounded-full ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="h-2 bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${checkinPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SalarySummary = () => {
    const totalBaseSalary = employees.reduce((sum, emp) => sum + (emp.baseSalary || 0), 0);
    const totalDeductions = employees.reduce((sum, emp) => {
      const salary = calculateSalary(emp);
      return sum + salary.totalDeductions;
    }, 0);
    const totalFinalSalary = totalBaseSalary - totalDeductions;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {totalBaseSalary.toLocaleString()} DA
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Base Salary
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold text-red-600`}>
                -{totalDeductions.toLocaleString()} DA
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Deductions
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                totalFinalSalary >= totalBaseSalary ? 'text-green-600' : 'text-gray-900'
              }`}>
                {totalFinalSalary.toLocaleString()} DA
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Final Salary
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Salary Management
          </h1>
          <p className={`mt-1 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Track employee salaries, deductions, and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          />
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Salary Rules */}
      <div className={`p-4 rounded-lg border mb-6 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Salary Rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Base Salary
              </p>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Based on employee's assigned salary
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
              <XCircle className="w-3 h-3 text-red-600" />
            </div>
            <div>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Missing Daily Report
              </p>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                -2,000 DA per day
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
              <Clock className="w-3 h-3 text-orange-600" />
            </div>
            <div>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Late Check-in
              </p>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                -1,000 DA (After 10am, Sun-Thu)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <SalarySummary />

      {/* Employee List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {employees.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>
    </div>
  );
};

export default SalaryManagement; 