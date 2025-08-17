import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import SuggestedClientService from '../services/suggestedClientService';
import UserService from '../services/userService';
import AddSuggestedClientPopup from '../components/AddSuggestedClientPopup';
import ValidationPopup from '../components/ValidationPopup';
import { 
  PlusCircle, Search, RefreshCw, ChevronLeft, ChevronRight, 
  Calendar, Download, Filter, FileText, FileSpreadsheet,
  Check, X, User, MapPin, Building2, Star, DollarSign,
  Eye, CheckCircle, Clock, Users
} from 'lucide-react';

const LeadCollectionsManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // Modal states
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isConfirmLeadOpen, setIsConfirmLeadOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    createdBy: '',
    status: '',
    wilaya: '',
    startDate: '',
    endDate: ''
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // User data for filtering
  const [usersMap, setUsersMap] = useState({});
  const [usersList, setUsersList] = useState([]);
  
  // Statistics
  const [stats, setStats] = useState({
    totalLeads: 0,
    pendingLeads: 0,
    confirmedLeads: 0,
    conversionRate: 0
  });

  // Debug stats changes
  useEffect(() => {
    console.log('Stats state updated:', stats);
  }, [stats]);

  // Check if user is super admin
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  // Fetch users data (only for super admin)
  const fetchUsers = async () => {
    if (!isSuperAdmin) {
      // For non-super admin users, we don't need the full user list
      // Just add current user to maps for consistency
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const userName = user.username || user.name || user.email || 'Me';
          setUsersMap({ [user._id || user.id]: userName });
          setUsersList([{
            id: user._id || user.id,
            name: userName,
            email: user.email,
            role: user.role
          }]);
        } catch (parseErr) {
          console.error('Error parsing user data:', parseErr);
        }
      }
      return;
    }

    try {
      const response = await UserService.getAllUsers();
      const users = response?.data || response || [];
      
      const userMap = {};
      const usersArray = [];
      
      if (Array.isArray(users)) {
        users.forEach(user => {
          const userName = user.username || user.name || user.email || 'Unknown User';
          userMap[user._id] = userName;
          usersArray.push({
            id: user._id,
            name: userName,
            email: user.email,
            role: user.role
          });
        });
      }
      
      setUsersMap(userMap);
      setUsersList(usersArray);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch user list. Please try again.');
    }
  };

  // Fetch lead collections (using suggested clients API)
  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // Add leadCollectionsMode flag to distinguish from regular suggested clients
      const filtersWithMode = { ...filters, leadCollectionsMode: 'true' };
      console.log('Fetching leads with filters:', filtersWithMode);
      
      const response = await SuggestedClientService.getAllSuggestedClients(page, limit, filtersWithMode);
      console.log('Full API Response:', response);
      
      if (response && response.data && response.data.clients) {
        const enrichedLeads = response.data.clients.map(lead => ({
          ...lead,
          creatorName: lead.creatorName || usersMap[lead.createdBy] || 'Unknown'
        }));
        
        setLeads(enrichedLeads);
        console.log('Enriched leads:', enrichedLeads);
        
        let totalLeads = 0;
        let pendingLeads = 0;
        let confirmedLeads = 0;
        
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalItems(response.data.pagination.totalItems || 0);
          totalLeads = response.data.pagination.totalItems || 0;
          console.log('Pagination info:', response.data.pagination);
        }
        
        // Use stats from API response if available
        if (response.data.stats) {
          console.log('Using API stats:', response.data.stats);
          
          // Map the API stats to our expected format using the exact field names from the console
          const apiStats = response.data.stats;
          const newStats = {
            totalLeads: apiStats.totalClients || 0,
            pendingLeads: apiStats.pendingClients || 0, 
            confirmedLeads: apiStats.validatedClients || 0,
            conversionRate: Math.round(apiStats.conversionRate || 0)
          };
          
          console.log('Mapped stats from API:', newStats);
          setStats(newStats);
        } else {
          // Fallback calculation
          console.log('No API stats, calculating manually');
          
          const currentPagePending = enrichedLeads.filter(lead => 
            lead.status === 'pending' || !lead.isValidated
          ).length;
          const currentPageConfirmed = enrichedLeads.filter(lead => 
            lead.isValidated === true
          ).length;
          
          const fallbackStats = {
            totalLeads: totalLeads,
            pendingLeads: currentPagePending,
            confirmedLeads: currentPageConfirmed,
            conversionRate: totalLeads > 0 ? Math.round((currentPageConfirmed / totalLeads) * 100) : 0
          };
          
          console.log('Fallback stats calculation:', fallbackStats);
          setStats(fallbackStats);
        }
        
        setError(null);
      } else {
        console.error('Invalid API response structure:', response);
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to fetch lead collections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      // Get current user first
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserRole(payload.role);
          
          const userData = localStorage.getItem('userData') || localStorage.getItem('user');
          if (userData) {
            setCurrentUser(JSON.parse(userData));
          }
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
    };

    initializeComponent();
  }, []);

  // Fetch users when user role is determined
  useEffect(() => {
    if (userRole) {
      fetchUsers();
    }
  }, [userRole, isSuperAdmin]);

  // Fetch leads when dependencies change
  useEffect(() => {
    if (userRole && currentUser) { // Wait for user role and current user to be loaded
      fetchLeads();
    }
  }, [page, limit, filters.status, filters.wilaya, filters.startDate, filters.endDate, filters.createdBy, userRole, currentUser]);



  // Handle search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Get filtered leads (client-side filtering for search only)
  const getFilteredLeads = () => {
    let filteredData = leads;
    
    // Apply search term filtering (backend handles role-based filtering)
    if (searchTerm) {
      filteredData = filteredData.filter(lead => 
        lead.suggestedClientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.storeAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phoneNumber?.includes(searchTerm) ||
        lead.wilaya?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.creatorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filteredData;
  };

  // Handle add lead
  const handleAddLead = () => {
    setCurrentLead(null);
    setIsAddLeadOpen(true);
  };

  // Handle confirm lead (using validation popup)
  const handleConfirmLead = (lead) => {
    setCurrentLead(lead);
    setIsConfirmLeadOpen(true);
  };

  // Handle success callbacks
  const handleAddLeadSuccess = () => {
    fetchLeads();
  };

  const handleConfirmLeadSuccess = () => {
    fetchLeads();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    console.log(`Filter change: ${filterName} = ${value}`);
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterName]: value
      };
      console.log('New filters state:', newFilters);
      return newFilters;
    });
    setPage(1); // Reset to first page when filtering
    
    // If filtering by createdBy, temporarily increase page size to get more results
    if (filterName === 'createdBy' && value) {
      console.log('Increasing page size for better filtering');
      setLimit(100); // Increase to get more results for filtering
    } else if (filterName === 'createdBy' && !value) {
      console.log('Resetting page size');
      setLimit(25); // Reset to normal page size
    }
  };

  // Clear filters
  const clearFilters = () => {
    console.log('Clearing all filters');
    setFilters({
      createdBy: '',
      status: '',
      wilaya: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
    setLimit(25); // Reset page size too
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Get status badge
  const getStatusBadge = (lead) => {
    let status, colorClass;
    
    if (lead.isValidated) {
      status = 'Confirmed';
      colorClass = theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
    } else {
      status = 'Pending';
      colorClass = theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800';
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
        {status}
      </span>
    );
  };

  // Stats Card Component
  const StatCard = ({ title, value, icon, theme }) => {
    console.log(`StatCard - ${title}: ${value}`);
    return (
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {icon}
          </div>
        </div>
        <div className="mt-2">
          <p className="text-3xl font-semibold">{value}</p>
        </div>
      </div>
    );
  };

  const filteredLeads = getFilteredLeads();

  // Debug the current stats
  console.log('Current stats state:', stats);
  console.log('Filtered leads count:', filteredLeads.length);
  console.log('Total items:', totalItems);

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Add Lead Popup (reusing AddSuggestedClientPopup) */}
      <AddSuggestedClientPopup
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={handleAddLeadSuccess}
        client={currentLead}
        theme={theme}
      />
      
      {/* Confirm Lead Popup (reusing ValidationPopup) */}
      <ValidationPopup
        isOpen={isConfirmLeadOpen}
        onClose={() => setIsConfirmLeadOpen(false)}
        onSuccess={handleConfirmLeadSuccess}
        client={currentLead}
        theme={theme}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Lead Collections</h1>
        <button
          onClick={handleAddLead}
          className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          <PlusCircle size={18} />
          Add Lead
        </button>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Leads" 
          value={stats.totalLeads} 
          theme={theme}
          icon={<Building2 size={20} />}
        />
        <StatCard 
          title="Pending Leads" 
          value={stats.pendingLeads} 
          theme={theme}
          icon={<Clock size={20} />}
        />
        <StatCard 
          title="Confirmed Leads" 
          value={stats.confirmedLeads} 
          theme={theme}
          icon={<CheckCircle size={20} />}
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${stats.conversionRate}%`}
          theme={theme}
          icon={<DollarSign size={20} />}
        />
      </div>

      {/* Filters */}
      <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Filter size={18} className="mr-2" />
            Filters
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset All Filters
            </button>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
          {/* Created By Filter - Only show for SUPER_ADMIN */}
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium mb-1">Created By</label>
              <select
                value={filters.createdBy}
                onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                className={`w-full px-3 py-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Users</option>
                {usersList.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="validated">Confirmed</option>
            </select>
          </div>

          {/* Wilaya Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Wilaya</label>
            <input
              type="text"
              value={filters.wilaya}
              onChange={(e) => handleFilterChange('wilaya', e.target.value)}
              placeholder="Filter by wilaya"
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
      </div>
      
      {/* Search and Refresh */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
            }`}
          />
        </div>
        <button
          onClick={fetchLeads}
          className={`p-2 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
          }`}
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
      
      {/* Total count display */}
      <div className="mb-4 text-sm">
        <span className="font-semibold">Total Records:</span> {totalItems} | 
        <span className="font-semibold ml-2">Showing:</span> {filteredLeads.length}
        {searchTerm && <span className="ml-2 italic">(filtered by search)</span>}
      </div>
      
      {/* Leads Table */}
      <div className={`overflow-hidden rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Lead ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Store Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created By</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? "8" : "7"} className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead._id || lead.suggestedClientId}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{lead.suggestedClientId}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{lead.storeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1 text-gray-400" />
                        {lead.wilaya}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {SuggestedClientService.formatDisplayPhoneNumber(lead.phoneNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(lead)}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User size={14} className="mr-1 text-gray-400" />
                          {lead.creatorName}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!lead.isValidated && (
                          <button 
                            onClick={() => handleConfirmLead(lead)}
                            className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Confirm lead"
                          >
                            <CheckCircle size={18} className="text-green-500" />
                          </button>
                        )}
                        
                        <button 
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="View details"
                        >
                          <Eye size={18} className="text-blue-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSuperAdmin ? "8" : "7"} className="px-6 py-10 text-center">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredLeads.length > 0 && (
          <div className={`px-6 py-3 flex justify-between items-center border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="text-sm">
              Showing {Math.min((page - 1) * limit + 1, totalItems)} to {Math.min(page * limit, totalItems)} of {totalItems} leads
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`p-1 rounded ${
                  page === 1
                    ? (theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400') 
                    : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className={`p-1 rounded ${
                  page >= totalPages
                    ? (theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                    : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
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

export default LeadCollectionsManagement;