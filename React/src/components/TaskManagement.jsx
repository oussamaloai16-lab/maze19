import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import {
  Plus,
  Filter,
  Search,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Circle,
  User,
  FileText,
  MessageSquare,
  Paperclip,
  Download,
  Upload,
  Edit,
  Trash2,
  Flag,
  Ban,
  CheckSquare,
  ArrowRight,
  MoreHorizontal,
  Eye,
  Target,
  TrendingUp,
  Timer,
  AlertTriangle,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import taskService from '../services/taskService';
import UserService from '../services/userService';

// Add custom styles for the range slider
const customStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  .slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

const TaskManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [activeView, setActiveView] = useState('kanban'); // kanban, list, stats
  const [tasks, setTasks] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assignedTo: '',
    taskType: '',
    priority: '',
    search: '',
    clientId: '' // Add clientId filter
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState([]); // Add clients state
  const [employees, setEmployees] = useState([]); // Add employees state

  const statusConfig = {
    pending: {
      title: 'Pending',
      icon: Circle,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      count: 0
    },
    'in-progress': {
      title: 'In Progress',
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      count: 0
    },
    review: {
      title: 'Review',
      icon: Eye,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      count: 0
    },
    completed: {
      title: 'Completed',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      count: 0
    },
    delivered: {
      title: 'Delivered',
      icon: CheckSquare,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      count: 0
    }
  };

  const priorityConfig = {
    low: { color: 'text-green-500', bg: 'bg-green-100' },
    medium: { color: 'text-yellow-500', bg: 'bg-yellow-100' },
    high: { color: 'text-orange-500', bg: 'bg-orange-100' },
    urgent: { color: 'text-red-500', bg: 'bg-red-100' }
  };

  // Fetch clients function
  const fetchClients = async () => {
    try {
      const response = await UserService.getAllUsers();
      
      let userList = [];
      
      if (Array.isArray(response)) {
        userList = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          userList = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          userList = response.users;
        } else if (response.results && Array.isArray(response.results)) {
          userList = response.results;
        }
      }
      
      const clientUsers = userList.filter(user => 
        user.role === 'CLIENT' || 
        user.role?.toLowerCase() === 'client'
      );
      
      setClients(clientUsers);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  // Fetch employees function
  const fetchEmployees = async () => {
    try {
      const response = await UserService.getAllUsers();
      
      let userList = [];
      
      if (Array.isArray(response)) {
        userList = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          userList = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          userList = response.users;
        } else if (response.results && Array.isArray(response.results)) {
          userList = response.results;
        }
      }
      
      const employeeUsers = userList.filter(user => 
        user.role !== 'CLIENT' && 
        user.role?.toLowerCase() !== 'client' &&
        user.isActive !== false
      );
      
      setEmployees(employeeUsers);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchClients();
    fetchEmployees();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kanbanData, statsData] = await Promise.all([
        taskService.getTasksKanban(filters),
        taskService.getTaskStats(filters)
      ]);

      // Handle kanban data
      if (kanbanData && kanbanData.data) {
        setTasks(kanbanData.data);
        // Update status counts
        Object.keys(statusConfig).forEach(status => {
          statusConfig[status].count = kanbanData.data[status]?.length || 0;
        });
      } else {
        setTasks({});
      }

      // Handle stats data
      if (statsData && statsData.data) {
        setStats(statsData.data);
      } else {
        setStats({});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load task data');
      setTasks({});
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const result = await taskService.updateTaskStatus(taskId, newStatus);
      if (result.success) {
        toast.success('Task status updated successfully');
        fetchData(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleAssignTask = async (taskId, assignedTo) => {
    try {
      const result = await taskService.assignTask(taskId, assignedTo);
      if (result.success) {
        toast.success('Task assigned successfully');
        fetchData(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  const handleProgressUpdate = async (taskId, progress) => {
    try {
      const result = await taskService.updateProgress(taskId, progress);
      if (result.success) {
        toast.success('Progress updated successfully');
        fetchData(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const TaskCard = ({ task }) => {
    const getPriorityIcon = () => {
      if (task.isUrgent) return <AlertTriangle className="w-4 h-4 text-red-500" />;
      if (task.priority === 'high') return <Flag className="w-4 h-4 text-orange-500" />;
      return null;
    };

    const getTypeColor = (taskType) => {
      const typeColors = {
        'PHOTOGRAPHY_PRODUCT': 'bg-blue-100 text-blue-800',
        'PHOTOGRAPHY_BRAND': 'bg-indigo-100 text-indigo-800',
        'VIDEO_PRODUCT_DEMO': 'bg-purple-100 text-purple-800',
        'VIDEO_BRAND_STORY': 'bg-pink-100 text-pink-800',
        'CREATIVE_DESIGN': 'bg-green-100 text-green-800',
        'LOGO_DESIGN': 'bg-teal-100 text-teal-800',
        'ADVERTISING_FACEBOOK': 'bg-red-100 text-red-800',
        'ADVERTISING_GOOGLE': 'bg-yellow-100 text-yellow-800',
        'SOCIAL_MEDIA_CONTENT': 'bg-cyan-100 text-cyan-800',
        'ECOMMERCE_DEVELOPMENT': 'bg-orange-100 text-orange-800'
      };
      return typeColors[taskType] || 'bg-gray-100 text-gray-800';
    };

    const formatTaskType = (taskType) => {
      return taskType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
      <div 
        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        } ${task.isBlocked ? 'opacity-60' : ''}`}
        onClick={() => {
          setSelectedTask(task);
          setShowTaskModal(true);
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getPriorityIcon()}
            <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(task.taskType)}`}>
              {formatTaskType(task.taskType)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {task.isBlocked && <Ban className="w-4 h-4 text-red-500" />}
            {task.attachments?.length > 0 && (
              <div className="flex items-center text-xs text-gray-500">
                <Paperclip className="w-3 h-3 mr-1" />
                {task.attachments.length}
              </div>
            )}
            {task.comments?.length > 0 && (
              <div className="flex items-center text-xs text-gray-500">
                <MessageSquare className="w-3 h-3 mr-1" />
                {task.comments.length}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className={`font-medium mb-2 line-clamp-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {task.title}
        </h3>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Progress
            </span>
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {task.progress || 0}%
            </span>
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${task.progress || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Footer - Updated with client info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Client Info */}
            {task.clientId && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                  Client: {task.clientId.username || task.clientId.name || task.clientId.email}
                </span>
              )}
            {task.assignedTo && (
              <div className="flex items-center text-xs text-gray-500">
                <User className="w-3 h-3 mr-1" />
                {task.assignedTo.username}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {task.dueDate && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
            {task.estimatedHours && (
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {task.estimatedHours}h
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const KanbanColumn = ({ status, statusInfo }) => {
    const columnTasks = tasks[status] || [];

    return (
      <div className={`flex-1 min-w-80 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      } rounded-lg p-4`}>
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <statusInfo.icon className={`w-5 h-5 ${statusInfo.color}`} />
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {statusInfo.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
              {columnTasks.length}
            </span>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {columnTasks.map(task => (
            <TaskCard key={task._id} task={task} />
          ))}
          {columnTasks.length === 0 && (
            <div className={`text-center py-8 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No tasks in {statusInfo.title.toLowerCase()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const StatsOverview = () => {
    const overviewStats = stats.overview || {};
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {overviewStats.total || 0}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Tasks
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {overviewStats.inProgress || 0}
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                In Progress
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {Math.round(overviewStats.avgProgress || 0)}%
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Avg Progress
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Timer className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {overviewStats.totalEstimatedHours || 0}h
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Estimated Hours
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
            Task Management
          </h1>
          <p className={`mt-1 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Manage and track your team's tasks and projects
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className={`flex rounded-lg border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <button
              onClick={() => setActiveView('kanban')}
              className={`px-4 py-2 text-sm rounded-l-lg ${
                activeView === 'kanban'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setActiveView('stats')}
              className={`px-4 py-2 text-sm rounded-r-lg ${
                activeView === 'stats'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Stats
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview />

      {/* Filters - Updated with client filter */}
      <div className={`mb-6 p-4 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className={`pl-10 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Client Filter */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Client
            </label>
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({...filters, clientId: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.username || client.name || client.email}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Task Type
            </label>
            <select
              value={filters.taskType}
              onChange={(e) => setFilters({...filters, taskType: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">All Types</option>
              <option value="PHOTOGRAPHY_PRODUCT">Photography - Product</option>
              <option value="PHOTOGRAPHY_BRAND">Photography - Brand</option>
              <option value="VIDEO_PRODUCT_DEMO">Video - Product Demo</option>
              <option value="VIDEO_BRAND_STORY">Video - Brand Story</option>
              <option value="CREATIVE_DESIGN">Creative Design</option>
              <option value="LOGO_DESIGN">Logo Design</option>
              <option value="ADVERTISING_FACEBOOK">Facebook Ads</option>
              <option value="ADVERTISING_GOOGLE">Google Ads</option>
              <option value="SOCIAL_MEDIA_CONTENT">Social Media Content</option>
              <option value="ECOMMERCE_DEVELOPMENT">E-commerce Development</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Assigned To
            </label>
            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">All Team Members</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.username || employee.name || employee.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeView === 'kanban' && (
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {Object.entries(statusConfig).map(([status, statusInfo]) => (
            <KanbanColumn 
              key={status} 
              status={status} 
              statusInfo={statusInfo}
            />
          ))}
        </div>
      )}

      {activeView === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Distribution Chart */}
          <div className={`p-6 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Tasks by Type
            </h3>
            <div className="space-y-3">
              {(stats.byType || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {item._id.replace(/_/g, ' ')}
                  </span>
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className={`p-6 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Tasks by Priority
            </h3>
            <div className="space-y-3">
              {(stats.byPriority || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      priorityConfig[item._id]?.bg || 'bg-gray-100'
                    }`}></div>
                    <span className={`text-sm capitalize ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {item._id}
                    </span>
                  </div>
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskModal && selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setShowTaskModal(false)}
          onUpdate={fetchData}
          theme={theme}
        />
      )}

      {/* Create Task Modal */}
      {/* Create Task Modal */}
    {showCreateModal && (
      <CreateTaskModal 
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchData}
        theme={theme}
        clients={clients}
        employees={employees}
      />
    )}
    </div>
  );
};

// Task Detail Modal Component
const TaskDetailModal = ({ task, onClose, onUpdate, theme }) => {
  const [comment, setComment] = useState('');
  const [progress, setProgress] = useState(task.progress || 0);
  const [status, setStatus] = useState(task.status);

  const handleStatusUpdate = async () => {
    try {
      await taskService.updateTaskStatus(task._id, status);
      toast.success('Status updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleProgressUpdate = async () => {
    try {
      await taskService.updateProgress(task._id, progress);
      toast.success('Progress updated successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      await taskService.addComment(task._id, comment);
      toast.success('Comment added successfully');
      setComment('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'from-gray-400 to-gray-500',
      'in-progress': 'from-blue-400 to-blue-500',
      review: 'from-yellow-400 to-yellow-500',
      completed: 'from-green-400 to-green-500',
      delivered: 'from-purple-400 to-purple-500'
    };
    return colors[status] || 'from-gray-400 to-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'from-green-400 to-green-500',
      medium: 'from-yellow-400 to-yellow-500',
      high: 'from-orange-400 to-orange-500',
      urgent: 'from-red-400 to-red-500'
    };
    return colors[priority] || 'from-gray-400 to-gray-500';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50' 
          : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200/50'
      }`}>
        {/* Header */}
        <div className={`px-8 py-8 border-b ${
          theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${getStatusColor(status)} shadow-lg`}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                  {task.title}
                </h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getPriorityColor(task.priority)} text-white`}>
                    {task.priority?.toUpperCase() || 'MEDIUM'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(status)} text-white`}>
                    {status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                theme === 'dark' 
                  ? 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Task Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Description */}
            <div className="lg:col-span-2">
              <h3 className={`text-lg font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                📝 Description
              </h3>
              <div className={`p-6 rounded-2xl ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
              }`}>
                <p className={`text-lg leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {task.description || 'No description provided'}
                </p>
              </div>
            </div>
            
            {/* Status & Progress Controls */}
            <div className="space-y-6">
              {/* Status Update */}
              <div className={`p-6 rounded-2xl ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
              }`}>
                <h4 className={`font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  🎯 Status
                </h4>
                <div className="space-y-3">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-lg font-medium ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 focus:border-blue-500'
                    }`}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="review">👁️ Review</option>
                    <option value="completed">✅ Completed</option>
                    <option value="delivered">📦 Delivered</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Update Status
                  </button>
                </div>
              </div>

              {/* Progress Update */}
              <div className={`p-6 rounded-2xl ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
              }`}>
                <h4 className={`font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📊 Progress ({progress}%)
                </h4>
                <div className="space-y-4">
                  <div className="relative">
                    <div className={`w-full h-4 bg-gray-200 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                    }}
                  />
                  <button
                    onClick={handleProgressUpdate}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Update Progress
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className={`p-6 rounded-2xl ${
            theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-bold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              💬 Comments ({task.comments?.length || 0})
            </h3>
            
            {/* Add Comment */}
            <div className="mb-6">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className={`flex-1 px-6 py-4 rounded-2xl border-2 transition-all duration-200 text-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 placeholder-gray-500 focus:border-blue-500'
                  }`}
                />
                <button
                  onClick={handleAddComment}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {(task.comments || []).map((comment, index) => (
                <div key={index} className={`p-6 rounded-2xl border-2 ${
                  theme === 'dark' 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {comment.author?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <span className={`font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {comment.author?.username || 'Unknown User'}
                        </span>
                        <div className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className={`text-lg leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {comment.content}
                  </p>
                </div>
              ))}
              {(!task.comments || task.comments.length === 0) && (
                <div className={`text-center py-12 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No comments yet</p>
                  <p className="text-sm">Be the first to add a comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Task Modal Component
const CreateTaskModal = ({ onClose, onSuccess, theme, clients = [], employees = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: '',
    priority: 'medium',
    estimatedHours: '',
    dueDate: '',
    clientId: '',
    assignedTo: '' // Add assignedTo field
  });

const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    setError(null);
    
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (!formData.taskType) {
      setError('Please select a task type');
      return;
    }
    
    if (!formData.clientId) {
      setError('Please select a client');
      return;
    }

    const result = await taskService.createTask(formData);
    if (result.success) {
      toast.success('Task created successfully');
      onSuccess();
      onClose();
    }
  } catch (error) {
    setError('Failed to create task');
    toast.error('Failed to create task');
  } finally {
    setLoading(false);
  }
};

  const priorityOptions = [
    { value: 'low', label: 'Low', icon: '🟢', color: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { value: 'medium', label: 'Medium', icon: '🟡', color: 'from-amber-500 to-yellow-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { value: 'high', label: 'High', icon: '🟠', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { value: 'urgent', label: 'Urgent', icon: '🔴', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
  ];

  const taskTypeOptions = [
    { value: 'PHOTOGRAPHY_PRODUCT', label: 'Photography - Product', icon: '📸' },
    { value: 'PHOTOGRAPHY_BRAND', label: 'Photography - Brand', icon: '🎨' },
    { value: 'VIDEO_PRODUCT_DEMO', label: 'Video - Product Demo', icon: '🎥' },
    { value: 'CREATIVE_DESIGN', label: 'Creative Design', icon: '✨' },
    { value: 'LOGO_DESIGN', label: 'Logo Design', icon: '🏷️' },
    { value: 'GRAPHIC_DESIGN', label: 'Graphic Design', icon: '🎭' },
    { value: 'SOCIAL_MEDIA_CONTENT', label: 'Social Media Content', icon: '📱' },
    { value: 'ADVERTISING_FACEBOOK', label: 'Facebook Advertising', icon: '📘' },
    { value: 'ADVERTISING_INSTAGRAM', label: 'Instagram Advertising', icon: '📷' },
    { value: 'OTHER', label: 'Other', icon: '📋' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-3xl rounded-3xl shadow-2xl ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50' 
          : 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200/50'
      }`}>
        {/* Header */}
        <div className={`px-8 py-8 border-b ${
          theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg`}>
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                  Create New Task
                </h2>
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Add a new task to your workflow
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                theme === 'dark' 
                  ? 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Title */}
          <div>
            <label className={`block text-sm font-bold mb-4 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter task title..."
              className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-200 focus:ring-4 focus:ring-offset-0 text-lg ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-bold mb-4 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the task details..."
              className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-200 focus:ring-4 focus:ring-offset-0 resize-none text-lg ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>

          {/* Task Type and Priority Row */}
          {/* Client Selection and Task Type Row */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Client Selection */}
  <div>
    <label className={`block text-sm font-bold mb-4 ${
      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
    }`}>
      Client *
    </label>
    <select
      name="clientId"
      required
      value={formData.clientId}
      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
      className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-200 focus:ring-4 focus:ring-offset-0 text-lg ${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20'
          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
      }`}
    >
      <option value="">Select Client</option>
      {Array.isArray(clients) && clients.map(client => (
        <option key={client._id} value={client._id}>
          {client.username || client.name || client.email || client._id}
        </option>
      ))}
    </select>
  </div>

  {/* Task Type */}
  <div>
    <label className={`block text-sm font-bold mb-4 ${
      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
    }`}>
      Task Type *
    </label>
    <select
      required
      value={formData.taskType}
      onChange={(e) => setFormData({...formData, taskType: e.target.value})}
      className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-200 focus:ring-4 focus:ring-offset-0 text-lg ${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20'
          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
      }`}
    >
      <option value="">Select task type</option>
      {taskTypeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.icon} {option.label}
        </option>
      ))}
    </select>
  </div>
</div>

{/* Assign To and Priority Row */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Assign To Employee */}
  <div>
    <label className={`block text-sm font-bold mb-4 ${
      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
    }`}>
      Assign To
    </label>
    <select
      name="assignedTo"
      value={formData.assignedTo}
      onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
      className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-200 focus:ring-4 focus:ring-offset-0 text-lg ${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20'
          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
      }`}
    >
      <option value="">Select Employee (Optional)</option>
      {Array.isArray(employees) && employees.map(employee => (
        <option key={employee._id} value={employee._id}>
          {employee.username || employee.name || employee.email} ({employee.role})
        </option>
      ))}
    </select>
  </div>

  {/* Priority - keep existing priority code */}
    <div>
      <label className={`block text-sm font-bold mb-4 ${
        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
      }`}>
        Priority
      </label>
      <div className="grid grid-cols-2 gap-3">
        {priorityOptions.map((priority) => (
          <button
            key={priority.value}
            type="button"
            onClick={() => setFormData({...formData, priority: priority.value})}
            className={`px-4 py-4 rounded-2xl border-2 transition-all duration-200 text-sm font-bold ${
              formData.priority === priority.value
                ? `${priority.bgColor} ${priority.borderColor} shadow-lg transform scale-105`
                : theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800/50'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">{priority.icon}</span>
              <span>{priority.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>

          {/* Estimated Hours and Due Date Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label className={`block text-sm font-bold mb-4 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Estimated Hours
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
                  placeholder="0"
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-200 focus:ring-4 focus:ring-offset-0 text-lg ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                <div className={`absolute right-6 top-1/2 transform -translate-y-1/2 text-lg font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  hours
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-bold mb-4 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-200 focus:ring-4 focus:ring-offset-0 text-lg ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-6 pt-8">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-8 py-4 rounded-2xl border-2 font-bold text-lg transition-all duration-200 ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:border-gray-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
                disabled={loading}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-bold text-lg rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskManagement; 