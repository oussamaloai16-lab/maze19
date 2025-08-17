// src/components/MFAVerification.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Loader, ArrowRight } from 'lucide-react';

const API_URL = 'http://localhost:5173/api';

const MFAVerification = ({ userId, onComplete, onCancel, theme }) => {
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please enter the verification code');
      return;
    }
    
    setVerifying(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/mfa/verify`, { 
        userId, 
        token 
      });
      
      // MFA verified successfully
      if (onComplete) {
        onComplete(true, response.data);
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };
  
  return (
    <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <Shield className={`h-8 w-8 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">Two-Factor Authentication</h2>
        <p className="text-sm">Enter the 6-digit code from your authenticator app to continue.</p>
      </div>
      
      <form onSubmit={handleVerify}>
        <div className="mb-6">
          <div className="flex justify-center">
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, '').substring(0, 6))}
              placeholder="000000"
              className={`text-center text-xl py-2 px-4 border rounded-md w-48 tracking-wider ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              maxLength={6}
              autoFocus
            />
          </div>
          {error && (
            <p className={`mt-2 text-sm text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </p>
          )}
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={verifying}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {verifying ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`w-full py-2 px-4 border text-sm font-medium rounded-md ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MFAVerification;