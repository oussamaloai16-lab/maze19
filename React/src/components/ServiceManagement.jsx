import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
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
  Legend
} from 'recharts';
import { 
  Briefcase,
  Download,
  MoreHorizontal,
  Calendar,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from 'lucide-react';
import NewServiceModal from './NewServiceModal';
import ServiceDetailsModal from './ServiceDetailsModal';
import serviceApi from '../services/serviceApi';
import { toast } from 'react-toastify';

const ServiceManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('all');
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [showServiceDetailsModal, setShowServiceDetailsModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalServices: { value: 0, change: 0 },
    activeServices: { value: 0, change: 0 },
    pendingServices: { value: 0, change: 0 },
    canceledServices: { value: 0, change: 0 }
  });
  const [serviceCategories, setServiceCategories] = useState([]);
  const [monthlyServiceData, setMonthlyServiceData] = useState([]);
  const [recentServices, setRecentServices] = useState([]);
  const [userRole, setUserRole] = useState(() => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData).role : null;
  });
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  useEffect(() => {
    fetchServiceData();
  }, [activeTab]);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch service statistics
      const statsData = await serviceApi.getServiceStats();
      setStats(statsData.stats);
      setServiceCategories(statsData.categoryDistribution);
      setMonthlyServiceData(statsData.monthlyTrends);

      // Fetch recent services with filter based on active tab
      const params = {
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const servicesData = await serviceApi.getServices(params);
      setRecentServices(servicesData.services);
    } catch (error) {
      console.error('Error fetching service data:', error);
      setError(error.message || 'Failed to load service data');
      toast.error(error.message || 'Failed to load service data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (serviceData) => {
    try {
      await serviceApi.createService(serviceData);
      toast.success('Service created successfully');
      setShowNewServiceModal(false);
      fetchServiceData(); // Refresh data
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error(error.message || 'Failed to create service');
    }
  };

  const handleStatusChange = async (serviceId, newStatus) => {
    try {
      await serviceApi.updateStatus(serviceId, newStatus);
      toast.success('Service status updated successfully');
      fetchServiceData(); // Refresh data
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error(error.message || 'Failed to update service status');
    }
  };

  const handleViewService = (serviceId) => {
    setSelectedServiceId(serviceId);
    setShowServiceDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    let bgColor, textColor;
    
    if (theme === 'dark') {
      if (status === 'Active') {
        bgColor = 'bg-green-900/30';
        textColor = 'text-green-400';
      } else if (status === 'Pending') {
        bgColor = 'bg-yellow-900/30';
        textColor = 'text-yellow-400';
      } else {
        bgColor = 'bg-red-900/30';
        textColor = 'text-red-400';
      }
    } else {
      if (status === 'Active') {
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
      } else if (status === 'Pending') {
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
      } else {
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
      }
    }
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  const canAddNewService = () => {
    return userRole === 'SUPER_ADMIN' || userRole === 'CHEF_DE_BUREAU';
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Service Management</h1>
        <div className="flex gap-2">
          {canAddNewService() && (
            <button
              onClick={() => setShowNewServiceModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              disabled={loading}
            >
              <Plus size={18} />
              New Service
            </button>
          )}
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
      
      {/* Date Range Selector */}
      <div className="mb-6">
        <button className={`flex items-center gap-2 px-4 py-2 rounded border ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-700'
        }`}>
          <Calendar size={18} />
          Last 30 days
        </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: 'Total Services', value: stats.totalServices.value, change: stats.totalServices.change, icon: <Briefcase size={20} /> },
              { title: 'Active Services', value: stats.activeServices.value, change: stats.activeServices.change, icon: <CheckCircle size={20} /> },
              { title: 'Pending Requests', value: stats.pendingServices.value, change: stats.pendingServices.change, icon: <Clock size={20} /> },
              { title: 'Canceled Services', value: stats.canceledServices.value, change: stats.canceledServices.change, icon: <XCircle size={20} /> }
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
                    <div className={`text-3xl font-semibold mt-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stat.value}
                    </div>
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
                    {Math.abs(stat.change).toFixed(1)}% last period
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Service Names Distribution Chart */}
            <div className={`p-6 rounded-lg shadow ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-lg font-semibold mb-4">Service Names Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceCategories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {serviceCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Service Engagement Chart */}
            <div className={`rounded-lg shadow ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <h2 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Monthly Service Trends
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyServiceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="active" name="Active" fill="#10b981" />
                      <Bar dataKey="pending" name="Pending" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Services Table */}
          <div className={`rounded-lg shadow ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Recent Services
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeTab === 'all'
                        ? theme === 'dark'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-gray-800'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeTab === 'active'
                        ? theme === 'dark'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-gray-800'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeTab === 'pending'
                        ? theme === 'dark'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-gray-800'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setActiveTab('canceled')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeTab === 'canceled'
                        ? theme === 'dark'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-gray-800'
                        : theme === 'dark'
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Canceled
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <th className="pb-4 font-medium">Service ID</th>
                      <th className="pb-4 font-medium">Service Name</th>
                      <th className="pb-4 font-medium">Client Name</th>
                      <th className="pb-4 font-medium">Request Date</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentServices.map((service) => (
                      <tr key={service._id} className={
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }>
                        <td className="py-4">{service._id}</td>
                        <td className="py-4">{service.serviceName}</td>
                        <td className="py-4">{service.clientName}</td>
                        <td className="py-4">{new Date(service.createdAt).toLocaleDateString()}</td>
                        <td className="py-4">{getStatusBadge(service.serviceStatus)}</td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => handleViewService(service._id)}
                            className={`text-sm font-medium ${
                              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                            }`}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Service Modal */}
      <NewServiceModal
        isOpen={showNewServiceModal}
        onClose={() => setShowNewServiceModal(false)}
        onSubmit={handleCreateService}
      />

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={showServiceDetailsModal}
        onClose={() => setShowServiceDetailsModal(false)}
        serviceId={selectedServiceId}
      />
    </div>
  );
};

export default ServiceManagement; 