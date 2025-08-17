// src/components/VerificationBanner.jsx
import React, { useState } from 'react';
import verificationService from '../services/verificationService';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

const VerificationBanner = ({ theme = 'light', onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleResendVerification = async () => {
    setLoading(true);
    setMessage('');
    setSuccess(false);
    
    try {
      const response = await verificationService.resendVerification();
      setSuccess(true);
      setMessage(response.message || 'Verification email sent successfully!');
    } catch (error) {
      setMessage(error.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`${theme === 'dark' ? 'bg-amber-900/40 text-amber-100' : 'bg-amber-100 text-amber-800'} px-4 py-3 rounded-md mb-4`}>
      <div className="flex justify-between items-start">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Your email address is not verified.</p>
            <p className="mt-1 text-sm">
              Please verify your email to access all features of the platform.
            </p>
            
            {success && (
              <p className={`mt-2 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'} text-sm`}>
                {message}
              </p>
            )}
            
            {message && !success && (
              <p className={`mt-2 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'} text-sm`}>
                {message}
              </p>
            )}
            
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className={`mt-2 inline-flex items-center text-sm font-medium ${
                theme === 'dark' 
                  ? 'text-amber-200 hover:text-white' 
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1" />
                  Sending verification email...
                </>
              ) : (
                'Resend verification email'
              )}
            </button>
          </div>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose} 
            className={`ml-4 ${theme === 'dark' ? 'text-amber-200 hover:text-white' : 'text-amber-800 hover:text-amber-900'}`}
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VerificationBanner;