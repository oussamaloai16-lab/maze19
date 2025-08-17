import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

const UnauthorizedPage = () => {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className={`max-w-md w-full p-8 rounded-lg shadow-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-center mb-6">
          <ShieldAlert size={80} className="text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-4">Access Denied</h1>
        
        <p className="text-center mb-6">
          You don't have permission to access this page. If you believe this is an error, please contact your administrator.
        </p>
        
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/homepage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              theme === 'dark' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            } transition-colors`}
          >
            <Home size={20} />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;