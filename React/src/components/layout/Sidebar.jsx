import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Users2,
  ShoppingBag,
  Wallet,
  BellRing,
  Settings2,
  UserCircle2,
  DollarSign,
  Target ,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  CalendarDays,
  MessageCircle,
  Briefcase,
  UserPlus,
  CheckSquare,
  CreditCard
} from 'lucide-react';

// Import roles and permissions
import ROLES from '../../../../Node/config/rbac/roles';
import PERMISSIONS from '../../../../Node/config/rbac/permissions';

const Sidebar = ({ user, onLogout }) => {
  const { theme } = useContext(ThemeContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const [userPermissions, setUserPermissions] = useState([]);
  
  useEffect(() => {
    // If user is undefined or null, try to retrieve from localStorage
    if (!user || !user.username) {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setLocalUser(parsedUser);
        extractPermissionsFromRole(parsedUser.role);
      }
    } else {
      // If we have a user, store it for future reference and update local state
      localStorage.setItem('userData', JSON.stringify(user));
      setLocalUser(user);
      extractPermissionsFromRole(user.role);
    }
  }, [user]);

  // Function to extract permissions from role
  const extractPermissionsFromRole = (roleName) => {
    // Handle undefined or null role
    if (!roleName) {
      console.warn('Role is undefined or null');
      return;
    }
    
    // Log the role for debugging
    console.log('Extracting permissions for role:', roleName);
    
    // If role is SUPER_ADMIN, grant all permissions by creating a manual array
    if (roleName === 'SUPER_ADMIN') {
      const allPermissions = [];
      // Generate all permissions from the PERMISSIONS object
      Object.keys(PERMISSIONS).forEach(resource => {
        Object.keys(PERMISSIONS[resource]).forEach(action => {
          allPermissions.push(PERMISSIONS[resource][action]);
        });
      });
      setUserPermissions(allPermissions);
      console.log('SUPER_ADMIN permissions set:', allPermissions);
      return;
    }
    
    // Otherwise try to get permissions from ROLES object
    const roleKey = roleName.toUpperCase().replace(/\s+/g, '_');
    
    if (ROLES[roleKey]) {
      const roleObj = ROLES[roleKey];
      const permissionsArray = [];
      
      // Flatten the permissions from the role
      roleObj.permissions.forEach(permissionGroup => {
        const resource = permissionGroup.resource;
        permissionGroup.actions.forEach(action => {
          permissionsArray.push(`${resource}:${action}`);
        });
      });
      
      setUserPermissions(permissionsArray);
      console.log('User permissions:', permissionsArray);
    } else {
      console.warn('Role not found in ROLES object:', roleName);
      setUserPermissions([]);
    }
  };

  // Check if the user has the required permission
  const hasPermission = (permission) => {
    // If no permission required, return true
    if (!permission) return true;
    
    // Super admin has all permissions
    if (localUser?.role === 'SUPER_ADMIN' || localUser?.role === 'Super Admin') return true;
    
    return userPermissions.includes(permission);
  };

  // Define all possible menu items with their required permissions
  // Added an "exists" property to each menu item to indicate if the page exists
  const allMenuItems = [
    { 
      icon: LayoutDashboard, 
      text: "Dashboard", 
      path: "/homepage",
      requiredPermission: null,
      exists: true
    },
    { 
      icon: Users2, 
      text: "User Management", 
      path: "/users",
      requiredPermission: PERMISSIONS.USERS.READ,
      exists: true
    },
    { 
      icon: ShoppingBag, 
      text: "Order Management", 
      path: "/orders",
      requiredPermission: PERMISSIONS.ORDERS.READ,
      exists: true
    },
    { 
      icon: Wallet, 
      text: "Payment Management", 
      path: "/payments",
      requiredPermission: PERMISSIONS.PAYMENTS.READ,
      exists: true
    },
    { 
      icon: DollarSign, 
      text: "Transactions", 
      path: "/transactions",
      requiredPermission: PERMISSIONS.TRANSACTIONS.READ,
      exists: true
    },
    { 
      icon: UserPlus, 
      text: "Suggested Clients", 
      path: "/suggested-clients",
      requiredPermission: PERMISSIONS.SUGGESTED_CLIENTS.READ,
      exists: true
    },
    { 
      icon: CalendarDays, 
      text: "Appointments", 
      path: "/appointments",
      requiredPermission: PERMISSIONS.APPOINTMENTS.READ,
      exists: true
    },
    { 
      icon: Briefcase, 
      text: "Services", 
      path: "/services",
      requiredPermission: PERMISSIONS.SERVICES.READ,
      exists: true
    },
    { 
      icon: CheckSquare, 
      text: "Task Management", 
      path: "/tasks",
      requiredPermission: PERMISSIONS.TASKS.READ,
      exists: true
    },
    { 
      icon: CreditCard, 
      text: "Salary Management", 
      path: "/salary",
      requiredPermission: PERMISSIONS.USERS.READ, // Using user permission for salary management
      exists: true
    },
    { 
      icon: FileText, 
      text: "Daily Report", 
      path: "/daily-report",
      requiredPermission: null, // All employees can submit daily reports
      exists: true
    },
    { 
      icon: FileText, 
      text: "Reports", 
      path: "/reports",
      requiredPermission: PERMISSIONS.REPORTS.READ,
      exists: true
    },
    { 
      icon: MessageCircle, 
      text: "Chat", 
      path: "/chat",
      requiredPermission: PERMISSIONS.CHAT.READ,
      exists: false
    },
    { 
      icon: BellRing, 
      text: "Notifications", 
      path: "/notifications",
      requiredPermission: null,
      exists: true
    },
    { 
      icon: Target, 
      text: "Lead Collections", 
      path: "/lead-collections",
      requiredPermission: PERMISSIONS.SUGGESTED_CLIENTS.READ, // Reusing same permission as suggested clients
      exists: true,
      hideForRoles: ['CLOSER', 'closer'] // Hide for CLOSER role
    },
    { 
      icon: Settings2, 
      text: "Settings", 
      path: "/settings",
      requiredPermission: null,
      exists: true
    },
  ];

  // Determine which menu items to show based on role
  const getMenuItems = () => {
    // For all roles, filter based on permissions and role-based hiding
    return allMenuItems.filter(item => {
      // Check if item should be hidden for current user's role
      if (item.hideForRoles && localUser?.role) {
        const shouldHide = item.hideForRoles.includes(localUser.role);
        if (shouldHide) return false;
      }
      
      // SUPER_ADMIN gets all remaining menu items after role filtering
      if (localUser?.role === 'SUPER_ADMIN') {
        return true;
      }
      
      // For other roles, also filter based on permissions
      if (!item.requiredPermission) return true; // Items with no required permission
      return hasPermission(item.requiredPermission);
    });
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={`${isCollapsed ? 'w-24' : 'w-60'} fixed h-full transition-all duration-300 ease-in-out ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } flex flex-col`}
    >
      <div className="flex justify-end pt-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-md mr-2 transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight size={24} />
          ) : (
            <ChevronLeft size={24} />
          )}
        </button>
      </div>

      {/* User profile section - fixed at the top */}
      <div className="px-6 py-4">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}>
          <div className={`w-12 h-12 rounded-xl ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'} flex items-center justify-center`}>
            <span className="text-white text-lg">{localUser?.username?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg">{localUser?.username || 'User'}</h2>
              {localUser?.role && (
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {localUser.role}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation section - scrollable */}
      <nav className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.text} className="relative">
              {item.exists ? (
                <Link
                  to={item.path}
                  className={`flex items-center py-5 ${
                    isCollapsed ? 'justify-center' : 'space-x-3'
                  } p-3 font-semibold rounded-xl transition-colors no-underline ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700/50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.text : ''}
                >
                  <item.icon size={24} strokeWidth={1.5} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.text}</span>}
                </Link>
              ) : (
                <div
                  className={`flex items-center py-5 ${
                    isCollapsed ? 'justify-center' : 'space-x-3'
                  } p-3 font-semibold rounded-xl transition-colors cursor-not-allowed ${
                    theme === 'dark'
                      ? 'text-gray-500 hover:bg-gray-700/30'
                      : 'text-gray-400 hover:bg-gray-100/70'
                  }`}
                  title={isCollapsed ? `${item.text} (Coming Soon)` : ''}
                >
                  <item.icon size={24} strokeWidth={1.5} />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.text}</span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`}>
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Logout button - fixed at the bottom */}
      <div className="px-6 py-4">
        <button
          onClick={onLogout}
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          } p-3 rounded-xl w-full transition-colors ${
            theme === 'dark'
              ? 'text-gray-300 hover:bg-gray-700/50'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={24} strokeWidth={1.5} />
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;