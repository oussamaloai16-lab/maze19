// UserManagement.jsx - Update to include verification banner, AddUserPopup, and export functionality
import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import UserService from '../services/userService';
import VerificationBanner from '../components/VerificationBanner';
import AddEmployeePopup from '../components/AddEmployeePopup';
import AddUserPopup from '../components/AddUserPopup';
import { 
  UserPlus,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  MoreHorizontal,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  DollarSign
} from 'lucide-react';
import { 
  downloadCSV, 
  downloadExcel, 
  prepareUsersForExport, 
  userExportHeaders 
} from '../utils/exportUtils';

const UserManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  
  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsers: 0
  });
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UserService.getAllUsers();
      
      // Handle various response formats
      let usersList = [];
      if (Array.isArray(data)) {
        usersList = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.users)) {
          usersList = data.users;
        } else if (Array.isArray(data.data)) {
          usersList = data.data;
        } else {
          console.error('Unexpected data format:', data);
        }
      } else {
        console.error('Invalid data format:', data);
      }
      
      // Calculate statistics
      setStats({
        totalUsers: usersList.length,
        activeUsers: usersList.filter(user => user.active).length,
        inactiveUsers: usersList.filter(user => !user.active).length,
        newUsers: usersList.filter(user => {
          const createdDate = new Date(user.createdAt);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return createdDate > oneMonthAgo;
        }).length
      });
      
      setUsers(usersList);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user's profile to check verification status
  const fetchUserProfile = async () => {
    try {
      const userData = await UserService.getProfile();
      setCurrentUser(userData);
      
      // Show banner if current user is not verified
      if (userData && userData.isVerified === false) {
        setShowVerificationBanner(true);
      } else {
        setShowVerificationBanner(false);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // If we can't fetch the profile, don't show the banner
      setShowVerificationBanner(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserProfile();
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        console.log("Deactivating user with ID:", userId);
        await UserService.deactivateUser(userId);
        
        // Refresh the user list
        await fetchUsers();
        
      } catch (err) {
        console.error("Error deactivating user:", err);
        setError(`Failed to deactivate user: ${err.message}`);
      }
    }
  };

  const handleAddEmployeeSuccess = () => {
    // Refresh the user list after adding an employee
    fetchUsers();
  };

  const handleAddUserSuccess = () => {
    // Refresh the user list after adding a user
    fetchUsers();
  };

  const getRoleBadgeColor = (role) => {
    const roleColors = {
      'SUPER_ADMIN': 'purple',
      'CHEF_DE_BUREAU': 'indigo',
      'RECEPTIONIST': 'blue',
      'GRAPHIC_DESIGNER': 'cyan',
      'CONFIRMATION_TEAM': 'teal',
      'ACCOUNTANT': 'green',
      'CLIENT': 'gray'
    };
    
    return roleColors[role] || 'gray';
  };

  const getStatusBadgeColor = (active) => {
    return active ? 'green' : 'red';
  };

  // Filter users based on search term and active tab
  const getFilteredUsers = () => {
    let filtered = users;
    
    // First filter by tab
    if (activeTab === 'Active') {
      filtered = filtered.filter(user => user.active);
    } else if (activeTab === 'Inactive') {
      filtered = filtered.filter(user => !user.active);
    }
    
    // Then filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  const handleAddUser = () => {
    setIsAddUserOpen(true);
  };

  const handleEditUser = (userId) => {
    // Implement navigation to user edit form
    console.log('Navigate to edit user:', userId);
  };

  const getPercentChange = (value) => {
    // Simulated percent changes for stats
    const changes = {
      'totalUsers': 25.2,
      'activeUsers': 18.2,
      'inactiveUsers': -1.2,
      'newUsers': 12.2
    };
    
    return changes[value] || 0;
  };

  // Export functions
  const handleExportClick = () => {
    setShowExportMenu(!showExportMenu);
  };

  const handleExportToCSV = () => {
    try {
      // Prepare data for export
      const exportData = prepareUsersForExport(filteredUsers);
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `users_export_${date}.csv`;
      
      // Download CSV file
      downloadCSV(exportData, userExportHeaders, filename);
      
      // Close the export menu
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setError('Failed to export users to CSV. Please try again.');
    }
  };

  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = prepareUsersForExport(filteredUsers);
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `users_export_${date}.xlsx`;
      
      // Download Excel file
      downloadExcel(exportData, userExportHeaders, filename);
      
      // Close the export menu
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export users to Excel. Please try again.');
    }
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Add Employee Popup */}
      <AddEmployeePopup
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={handleAddEmployeeSuccess}
        theme={theme}
      />
      
      {/* Add User Popup */}
      <AddUserPopup
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSuccess={handleAddUserSuccess}
        theme={theme}
      />
      
      {/* Email Verification Banner */}
      {showVerificationBanner && (
        <VerificationBanner 
          theme={theme} 
          onClose={() => setShowVerificationBanner(false)} 
        />
      )}
    
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              onClick={handleExportClick}
            >
              <Download size={18} />
              Export
            </button>
            
            {showExportMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } ring-1 ring-black ring-opacity-5`}>
                <div className="py-1">
                  <button
                    onClick={handleExportToCSV}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      theme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } flex items-center`}
                  >
                    <FileText size={16} className="mr-2" />
                    Export to CSV
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      theme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    } flex items-center`}
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export to Excel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <MoreHorizontal size={18} />
              More actions
            </button>
          </div>
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <UserPlus size={18} />
            Create user
          </button>
          <button
            onClick={() => setIsAddEmployeeOpen(true)} // Open the popup
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <UserPlus size={18} />
            Add employee
          </button>
        </div>
      </div>
      
      {/* Date Range Selector */}
      <div className="mb-6">
        <button className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700">
          <Calendar size={18} />
          {dateRange}
        </button>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          percentChange={getPercentChange('totalUsers')} 
          theme={theme}
        />
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers} 
          percentChange={getPercentChange('activeUsers')} 
          theme={theme}
        />
        <StatCard 
          title="Inactive Users" 
          value={stats.inactiveUsers} 
          percentChange={getPercentChange('inactiveUsers')} 
          theme={theme}
        />
        <StatCard 
          title="New Users" 
          value={stats.newUsers} 
          percentChange={getPercentChange('newUsers')} 
          theme={theme}
        />
      </div>
      
      {/* Tab Filters */}
      <div className="flex mb-4 border-b border-gray-200">
        {['All', 'Active', 'Inactive'].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab 
                ? `border-b-2 border-blue-500 text-blue-600` 
                : `text-gray-500 hover:text-gray-700`
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <button 
          className="ml-2 flex items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-700"
          onClick={() => console.log('Add custom filter')}
        >
          <PlusCircle size={16} />
          Add filter
        </button>
      </div>
      
      {/* Search and Refresh */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-800 text-white border-gray-700' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          />
        </div>
        <button
          onClick={fetchUsers}
          className={`p-2 rounded-lg ${
            theme === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
          }`}
          title="Refresh user list"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {error && (
        <div className={`mb-4 p-3 rounded ${
          theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      )}
      
      {/* Users Table */}
      <div className={`overflow-hidden rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Username</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Verified</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Auth Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Salary (DA)</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        theme === 'dark' 
                          ? `bg-${getRoleBadgeColor(user.role)}-900 text-${getRoleBadgeColor(user.role)}-300` 
                          : `bg-${getRoleBadgeColor(user.role)}-100 text-${getRoleBadgeColor(user.role)}-800`
                      }`}>
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        theme === 'dark' 
                          ? `bg-${getStatusBadgeColor(user.active)}-900 text-${getStatusBadgeColor(user.active)}-300` 
                          : `bg-${getStatusBadgeColor(user.active)}-100 text-${getStatusBadgeColor(user.active)}-800`
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isVerified 
                          ? (theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800')
                          : (theme === 'dark' ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                      }`}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.authProvider}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <DollarSign size={14} className="text-green-600" />
                        <span className="font-medium">{(user.baseSalary ?? 35000).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditUser(user._id)}
                          className={`p-1 rounded-lg ${
                            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Pencil size={18} className="text-blue-500" />
                        </button>
                        {user.active && (
                          <button 
                            onClick={() => handleDelete(user._id)}
                            className={`p-1 rounded-lg ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className={`px-6 py-3 flex justify-between items-center border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="text-sm">
              Showing 1 to {filteredUsers.length} of {filteredUsers.length} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className={`px-3 py-1 rounded ${
                  theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                1
              </button>
              <button
                className={`p-1 rounded ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, percentChange, theme }) => {
  const isPositive = percentChange >= 0;
  
  return (
    <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-semibold">{value}</p>
        <p className={`ml-2 text-sm font-medium ${
          isPositive 
            ? 'text-green-500' 
            : 'text-red-500'
        }`}>
          <span>{isPositive ? '↑' : '↓'} {Math.abs(percentChange)}% last week</span>
        </p>
      </div>
    </div>
  );
};

export default UserManagement;