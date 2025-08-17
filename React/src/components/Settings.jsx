import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { 
  Save, 
  Moon, 
  Sun, 
  Bell, 
  Lock, 
  User, 
  Globe, 
  HelpCircle, 
  MessageSquare,
  Shield,
  UserPlus
} from 'lucide-react';

const Settings = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [language, setLanguage] = useState('english');
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? <Moon size={18} /> : <Sun size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'language', label: 'Language', icon: <Globe size={18} /> },
    { id: 'permissions', label: 'Permissions', icon: <Shield size={18} /> },
    { id: 'help', label: 'Help & Support', icon: <HelpCircle size={18} /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Profile Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className={`w-20 h-20 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                    <UserPlus size={32} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                  <button className={`px-3 py-1.5 text-sm rounded ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Change
                  </button>
                  <button className={`px-3 py-1.5 text-sm rounded ${theme === 'dark' ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                    Remove
                  </button>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name
                </label>
                <input 
                  type="text" 
                  className={`w-full px-3 py-2 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  defaultValue="John Doe"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input 
                  type="email" 
                  className={`w-full px-3 py-2 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  defaultValue="john.doe@example.com"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Bio
                </label>
                <textarea 
                  rows="3" 
                  className={`w-full px-3 py-2 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  defaultValue="System administrator with 5 years of experience."
                />
              </div>
              
              <div className="pt-4">
                <button className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}>
                  <Save size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Appearance Settings
            </h2>
            <div className="space-y-4">
              <div>
                <span className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Theme
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={theme === 'dark' ? toggleTheme : undefined}
                    className={`p-4 rounded-lg border-2 cursor-pointer ${
                      theme !== 'dark' 
                        ? 'border-blue-500 bg-white shadow-sm' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <Sun size={20} className="text-amber-500" />
                      <div className={`w-4 h-4 rounded-full ${theme !== 'dark' ? 'bg-blue-500' : 'border border-gray-400'}`} />
                    </div>
                    <h3 className="font-medium text-gray-900">Light Mode</h3>
                    <p className="text-sm text-gray-500 mt-1">Use light theme for the interface</p>
                  </div>
                  
                  <div 
                    onClick={theme === 'light' || !theme ? toggleTheme : undefined}
                    className={`p-4 rounded-lg border-2 cursor-pointer ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-gray-800 shadow-sm' 
                        : 'border-gray-300 bg-gray-800 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <Moon size={20} className="text-indigo-400" />
                      <div className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-blue-500' : 'border border-gray-400'}`} />
                    </div>
                    <h3 className="font-medium text-white">Dark Mode</h3>
                    <p className="text-sm text-gray-300 mt-1">Use dark theme for the interface</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-3">
                <span className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sidebar Compact Mode
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" />
                  <div className={`w-11 h-6 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 peer-focus:ring-blue-800' 
                      : 'bg-gray-200 peer-focus:ring-blue-300'
                  } peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                  <span className={`ml-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Enable compact sidebar
                  </span>
                </label>
              </div>
            </div>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Notification Settings
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Enable Notifications
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Receive notifications about updates and activity
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationsEnabled}
                    onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                    className="sr-only peer" 
                  />
                  <div className={`w-11 h-6 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 peer-focus:ring-blue-800' 
                      : 'bg-gray-200 peer-focus:ring-blue-300'
                  } peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
              </div>
              
              {notificationsEnabled && (
                <>
                  <div className="pl-2 border-l-2 border-blue-500 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Email Notifications
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Receive email notifications
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={emailNotifications}
                          onChange={() => setEmailNotifications(!emailNotifications)}
                          className="sr-only peer" 
                        />
                        <div className={`w-11 h-6 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 peer-focus:ring-blue-800' 
                            : 'bg-gray-200 peer-focus:ring-blue-300'
                        } peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Browser Notifications
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Show browser notifications
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={browserNotifications}
                          onChange={() => setBrowserNotifications(!browserNotifications)}
                          className="sr-only peer" 
                        />
                        <div className={`w-11 h-6 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 peer-focus:ring-blue-800' 
                            : 'bg-gray-200 peer-focus:ring-blue-300'
                        } peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h3 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Notification Types
                    </h3>
                    
                    {['User activity', 'System updates', 'Payment notifications', 'Order updates'].map((item, index) => (
                      <div key={index} className="flex items-center mb-3">
                        <input
                          id={`notification-${index}`}
                          type="checkbox"
                          defaultChecked={index < 2}
                          className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        />
                        <label
                          htmlFor={`notification-${index}`}
                          className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <div className="pt-4">
                <button className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}>
                  <Save size={18} />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div className="space-y-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Security Settings
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className={`font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Current Password
                    </label>
                    <input 
                      type="password" 
                      className={`w-full px-3 py-2 rounded-md ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      New Password
                    </label>
                    <input 
                      type="password" 
                      className={`w-full px-3 py-2 rounded-md ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm New Password
                    </label>
                    <input 
                      type="password" 
                      className={`w-full px-3 py-2 rounded-md ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <button className={`px-4 py-2 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                    Update Password
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Two-Factor Authentication
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={twoFactorAuth}
                      onChange={() => setTwoFactorAuth(!twoFactorAuth)}
                      className="sr-only peer" 
                    />
                    <div className={`w-11 h-6 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 peer-focus:ring-blue-800' 
                        : 'bg-gray-200 peer-focus:ring-blue-300'
                    } peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                  </label>
                </div>
                
                {twoFactorAuth && (
                  <div className="mt-4 p-4 rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      Two-factor authentication is now enabled. Use an authenticator app to scan the QR code.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Active Sessions
                </h3>
                
                <div className={`p-4 rounded-md mb-3 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="flex justify-between">
                    <div>
                      <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Current Session
                      </h4>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        MacOS • Chrome • New York, USA
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full self-start ${
                      theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                    }`}>
                      Active Now
                    </span>
                  </div>
                </div>
                
                <button className={`text-sm ${
                  theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'
                }`}>
                  Log out of all other sessions
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'language':
        return (
          <div className="space-y-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Language Settings
            </h2>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Language
              </label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                <option value="english">English</option>
                <option value="french">French</option>
                <option value="spanish">Spanish</option>
                <option value="german">German</option>
                <option value="chinese">Chinese</option>
                <option value="japanese">Japanese</option>
                <option value="arabic">Arabic</option>
              </select>
              
              <div className="mt-6">
                <button className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}>
                  <Save size={18} />
                  <span>Save Language</span>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'permissions':
        return (
          <div className="space-y-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Permissions & Access
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Your Role
                </h3>
                <div className={`p-4 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${
                    theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Administrator
                  </span>
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    You have full access to manage all aspects of the system.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Access Permissions
                </h3>
                
                <div className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {['View users', 'Create users', 'Edit users', 'Delete users', 'Manage payments', 'View reports', 'System configuration'].map((perm, index) => (
                    <div key={index} className="flex items-center justify-between py-3">
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                        {perm}
                      </span>
                      <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  API Access
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Personal API Tokens
                    </h4>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Manage your API tokens for third-party access
                    </p>
                  </div>
                  <button className={`px-3 py-1.5 text-sm rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}>
                    Manage Tokens
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'help':
        return (
            <div className="space-y-6">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Help & Support
            </h2>
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className={`font-medium mb-2 flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <HelpCircle size={18} className="mr-2" />
                  Need Help?
                </h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Our support team is available to assist you with any questions or issues.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className={`px-3 py-2 rounded-md text-sm flex items-center ${
                    theme === 'dark' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                    <MessageSquare size={16} className="mr-2" />
                    Contact Support
                  </button>
                  <button className={`px-3 py-2 rounded-md text-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}>
                    View Documentation
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Frequently Asked Questions
                </h3>
                
                <div className={`space-y-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {[
                    { q: 'How do I reset my password?', a: 'You can reset your password by going to the login page and clicking on "Forgot Password".' },
                    { q: 'How do I update my profile information?', a: 'Go to Settings > Profile and update your information there.' },
                    { q: 'Can I change my email address?', a: 'Yes, you can change your email address in the Profile section of Settings.' },
                    { q: 'How do I export my data?', a: 'You can export your data from each section using the Export button in the top right corner.' }
                  ].map((faq, index) => (
                    <details key={index} className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    } shadow-sm`}>
                      <summary className={`font-medium cursor-pointer ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {faq.q}
                      </summary>
                      <p className={`mt-2 text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  System Information
                </h3>
                <div className={`rounded-lg overflow-hidden border ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <tbody className={`divide-y ${
                      theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                    }`}>
                      <tr>
                        <td className={`px-4 py-3 text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Version
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          2.4.0
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-4 py-3 text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Last Updated
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          April 1, 2025
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-4 py-3 text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Browser
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Chrome 112.0.5615.121
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-4 py-3 text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Operating System
                        </td>
                        <td className={`px-4 py-3 text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          macOS 14.3.1
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-8 text-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              Select a tab to view settings
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings Navigation */}
          <div className={`w-full lg:w-64 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } rounded-lg shadow p-4`}>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-md transition-colors ${
                    activeTab === tab.id 
                      ? theme === 'dark'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900' 
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Settings Content */}
          <div className={`flex-1 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } rounded-lg shadow p-6`}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;