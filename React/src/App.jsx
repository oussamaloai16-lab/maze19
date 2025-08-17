import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';
import PERMISSIONS from '../../Node/config/rbac/permissions';

// Page imports
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import HomePage from './components/HomePage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import UserManagement from '@components/UserManagment';
import OrderManagement from '@components/OrderManagement';
import PaymentManagement from '@components/PaymentManagement';
import TransactionManagement from '@components/TransactionManagement';
import AppointmentManagement from '@components/AppointmentManagement';
import ServiceManagement from '@components/ServiceManagement';
import TaskManagement from '@components/TaskManagement';
import SalaryManagement from '@components/SalaryManagement';
import Notifications from '@components/Notifications';
import Settings from '@components/Settings';
import Profile from './components/Profile';
import VerifyEmail from '@components/VerifyEmail';
import UnauthorizedPage from '@components/UnauthorizedPage';
import Layout from './components/layout/Layout';
import EmployeeDailyReport from '@components/EmployeeDailyReport';

// Styles
import "./styles/theme.css";
import SuggestedClientsManagement from '@components/SuggestedClientsManagement';
import LeadCollectionsManagement from '@components/LeadCollectionsManagement';
import ReportsManagement from '@components/ReportsManagement';

import PrivateRoute from './components/PrivateRoute';

// Theme toggle component that hides on landing page
const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  
  // Hide theme toggle on landing page
  if (location.pathname === '/') {
    return null;
  }
  
  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-yellow-300 transition-colors duration-200 z-50 shadow-lg hover:shadow-xl"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

const App = () => {
  const { theme } = useContext(ThemeContext);
  
  return (
    <div className={`app-container ${theme}`}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeToggle />
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public routes */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/auth">
              <Route path="signin" element={<LoginPage />} />
              <Route path="signup" element={<SignUpPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>
            
            {/* Routes accessible to all authenticated users */}
            <Route element={<Layout />}>
              <Route path="/homepage" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/daily-report" element={<PrivateRoute><EmployeeDailyReport /></PrivateRoute>} />
              
              {/* Permission-protected routes */}
              <Route path="/users" element={<PrivateRoute requiredPermission={PERMISSIONS.USERS.READ}><UserManagement /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute requiredPermission={PERMISSIONS.ORDERS.READ}><OrderManagement /></PrivateRoute>} />
              <Route path="/lead-collections" element={<PrivateRoute requiredPermission={PERMISSIONS.SUGGESTED_CLIENTS.READ}><LeadCollectionsManagement /></PrivateRoute>} />
              <Route path="/payments" element={<PrivateRoute requiredPermission={PERMISSIONS.PAYMENTS.READ}><PaymentManagement /></PrivateRoute>} />
              <Route path="/transactions" element={<PrivateRoute requiredPermission={PERMISSIONS.TRANSACTIONS.READ}><TransactionManagement /></PrivateRoute>} />
              <Route path="/appointments" element={<PrivateRoute requiredPermission={PERMISSIONS.APPOINTMENTS.READ}><AppointmentManagement /></PrivateRoute>} />
              <Route path="/suggested-clients" element={<PrivateRoute requiredPermission={PERMISSIONS.SUGGESTED_CLIENTS.READ}><SuggestedClientsManagement /></PrivateRoute>} />
              <Route path="/services" element={<PrivateRoute requiredPermission={PERMISSIONS.SERVICES.READ}><ServiceManagement /></PrivateRoute>} />
              <Route path="/tasks" element={<PrivateRoute requiredPermission={PERMISSIONS.TASKS.READ}><TaskManagement /></PrivateRoute>} />
              <Route path="/salary" element={<PrivateRoute requiredPermission={PERMISSIONS.USERS.READ}><SalaryManagement /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute requiredPermission={PERMISSIONS.REPORTS.READ}><ReportsManagement /></PrivateRoute>} />
            </Route>
            
            {/* Catch all redirect */}
            <Route path="*" element={
              <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
                <p className="mb-6">Sorry, the page you are looking for doesn't exist or is still being implemented.</p>
                <a href="/homepage" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Return to Dashboard
                </a>
              </div>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
};

export default App;