import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { 
  BellRing, 
  UserPlus,
  DollarSign,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Settings
} from 'lucide-react';

const Notifications = () => {
  const { theme } = useContext(ThemeContext);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'system', label: 'System' },
    { id: 'transactions', label: 'Transactions' }
  ];
  
  const notifications = [
    {
      id: 1,
      type: 'user',
      title: 'New user registered',
      message: 'John Doe has created an account.',
      time: '10 minutes ago',
      read: false,
      icon: <UserPlus size={18} />
    },
    {
      id: 2,
      type: 'transaction',
      title: 'Payment received',
      message: 'You received a payment of $1,200.00',
      time: '1 hour ago',
      read: false,
      icon: <DollarSign size={18} />
    },
    {
      id: 3,
      type: 'system',
      title: 'System update completed',
      message: 'The system has been updated to version 2.4.0',
      time: '3 hours ago',
      read: true,
      icon: <Settings size={18} />
    },
    {
      id: 4,
      type: 'transaction',
      title: 'Order fulfilled',
      message: 'Order #ORD-5291 has been completed and shipped',
      time: '5 hours ago',
      read: true,
      icon: <ShoppingBag size={18} />
    },
    {
      id: 5,
      type: 'transaction',
      title: 'Payment declined',
      message: 'A payment for $450.00 was declined',
      time: 'Yesterday',
      read: true,
      icon: <CreditCard size={18} />
    },
    {
      id: 6,
      type: 'system',
      title: 'Security alert',
      message: 'Unusual login attempt detected. Please verify your account security.',
      time: 'Yesterday',
      read: true,
      icon: <AlertCircle size={18} />
    },
    {
      id: 7,
      type: 'user',
      title: 'Profile updated',
      message: 'Your profile information has been updated successfully',
      time: '2 days ago',
      read: true,
      icon: <CheckCircle size={18} />
    },
    {
      id: 8,
      type: 'system',
      title: 'Scheduled maintenance',
      message: 'System maintenance scheduled for April 10, 2025 at 2:00 AM UTC',
      time: '3 days ago',
      read: true,
      icon: <Clock size={18} />
    },
    {
      id: 9,
      type: 'transaction',
      title: 'Invoice due',
      message: 'Invoice #INV-2938 is due in 3 days',
      time: '4 days ago',
      read: true,
      icon: <Calendar size={18} />
    }
  ];
  
  const getIconBackground = (type, isRead) => {
    if (theme === 'dark') {
      switch (type) {
        case 'user':
          return isRead ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-700/50 text-blue-300';
        case 'transaction':
          return isRead ? 'bg-green-900/30 text-green-400' : 'bg-green-700/50 text-green-300';
        case 'system':
          return isRead ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-700/50 text-yellow-300';
        default:
          return isRead ? 'bg-gray-700 text-gray-300' : 'bg-gray-600 text-white';
      }
    } else {
      switch (type) {
        case 'user':
          return isRead ? 'bg-blue-100 text-blue-600' : 'bg-blue-200 text-blue-700';
        case 'transaction':
          return isRead ? 'bg-green-100 text-green-600' : 'bg-green-200 text-green-700';
        case 'system':
          return isRead ? 'bg-yellow-100 text-yellow-600' : 'bg-yellow-200 text-yellow-700';
        default:
          return isRead ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-700';
      }
    }
  };
  
  const getFilteredNotifications = () => {
    if (activeFilter === 'all') {
      return notifications;
    } else if (activeFilter === 'unread') {
      return notifications.filter(notification => !notification.read);
    } else {
      return notifications.filter(notification => notification.type === activeFilter);
    }
  };
  
  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
              }`}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <button className={`text-sm font-medium ${
            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
          }`}>
            Mark all as read
          </button>
        </div>
        
        {/* Filters */}
        <div className="mb-6">
          <div className={`inline-flex rounded-md shadow-sm ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {filters.map((filter, index) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeFilter === filter.id
                    ? theme === 'dark'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700/50'
                      : 'text-gray-700 hover:bg-gray-50'
                } ${index === 0 ? 'rounded-l-md' : ''} ${
                  index === filters.length - 1 ? 'rounded-r-md' : ''
                }`}
              >
                {filter.label}
                {filter.id === 'unread' && unreadCount > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Notifications List */}
        <div className={`rounded-lg shadow ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellRing size={40} className={`mx-auto mb-4 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className="text-lg font-medium mb-1">No notifications</h3>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                {activeFilter === 'unread' 
                  ? "You've read all your notifications" 
                  : "You don't have any notifications yet"}
              </p>
            </div>
          ) : (
            <ul className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredNotifications.map((notification) => (
                <li 
                  key={notification.id}
                  className={`p-4 ${!notification.read && (theme === 'dark' ? 'bg-gray-750' : 'bg-blue-50')} ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                      getIconBackground(notification.type, notification.read)
                    }`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {notification.time}
                        </p>
                      </div>
                      <p className={`text-sm mt-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Pagination */}
        {filteredNotifications.length > 0 && (
          <div className="mt-4 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className={`px-3 py-1 rounded text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}>
                Previous
              </button>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                1 of 1
              </span>
              <button className={`px-3 py-1 rounded text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}>
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;