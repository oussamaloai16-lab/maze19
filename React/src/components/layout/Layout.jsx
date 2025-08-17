// Layout.jsx - Updated
import React, { useContext, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { ThemeContext } from 'src/context/ThemeContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  

  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      <main className={`${theme === 'dark' ? 'text-white' : 'bg-gray-50 text-gray-800'} transition-all h-screenduration-300 ${isCollapsed ? 'ml-24' : 'ml-60'}`}>
        <div className="p-6 h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;