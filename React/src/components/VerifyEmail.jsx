// src/pages/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import verificationService from '../services/verificationService';
import { CheckCircle, AlertTriangle, RefreshCw, Mail } from 'lucide-react';

const VerifyEmail = () => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get token from URL
  const query = new URLSearchParams(location.search);
  const token = query.get('token');
  
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }
      
      try {
        const response = await verificationService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Verification failed. Please try again.');
      }
    };
    
    verifyToken();
  }, [token]);
  
  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }
    
    setResendLoading(true);
    setResendSuccess(false);
    
    try {
      const response = await verificationService.resendPublicVerification(email);
      setResendSuccess(true);
      setMessage(response.message || 'Verification email sent successfully!');
    } catch (error) {
      setMessage(error.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };
  
  const redirectToLogin = () => {
    navigate('/login');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <RefreshCw size={48} className="text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Email</h2>
            <p className="text-gray-600 text-center">Please wait while we verify your email...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Email Verified!</h2>
            <p className="text-gray-600 text-center mb-6">{message}</p>
            <button
              onClick={redirectToLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors w-full"
            >
              Go to Login
            </button>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-gray-600 text-center mb-6">{message}</p>
            
            <div className="w-full border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4">Resend Verification Email</h3>
              <form onSubmit={handleResendVerification}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors w-full"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={18} className="mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
                
                {resendSuccess && (
                  <p className="mt-3 text-green-600 text-sm text-center">
                    Verification email sent! Please check your inbox.
                  </p>
                )}
              </form>
            </div>
            
            <button
              onClick={redirectToLogin}
              className="mt-6 text-blue-600 hover:underline"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;