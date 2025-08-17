// src/components/MFASetup.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Check, X, Loader } from 'lucide-react';

const API_URL = 'http://localhost:5173/api';

const MFASetup = ({ onComplete, theme }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  
  useEffect(() => {
    generateMFA();
  }, []);
  
  const generateMFA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/mfa/generate`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setQrCode(response.data.data.qrCodeUrl);
      setSecret(response.data.data.secret);
    } catch (error) {
      console.error('MFA generation error:', error);
      setError(error.response?.data?.message || 'Failed to generate MFA setup');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setVerificationError('Please enter the verification code');
      return;
    }
    
    setVerifying(true);
    setVerificationError(null);
    
    try {
      const response = await axios.post(`${API_URL}/mfa/enable`, { token }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // MFA enabled successfully
      if (onComplete) {
        onComplete(true, response.data.data.message);
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      setVerificationError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-lg">Generating your secure setup...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`p-4 rounded-md ${theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}>
        <div className="flex">
          <X className="h-5 w-5 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium">Failed to set up two-factor authentication</h3>
            <p className="mt-1">{error}</p>
            <button
              onClick={generateMFA}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-6 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center mb-4">
        <Shield className={`h-6 w-6 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
        <h2 className="text-xl font-semibold">Set Up Two-Factor Authentication</h2>
      </div>
      
      <p className="mb-6">Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.</p>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Step 1: Scan this QR code</h3>
          <p className="text-sm mb-4">Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to scan this QR code.</p>
          <div className={`p-4 ${theme === 'dark' ? 'bg-white' : 'bg-gray-100'} rounded-md flex justify-center mb-4`}>
            {qrCode && <img src={qrCode} alt="QR Code" width={200} height={200} />}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Step 2: Can't scan the code?</h3>
          <p className="text-sm mb-2">Enter this key manually in your app:</p>
          <div className={`font-mono p-3 rounded break-all ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
            {secret}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Step 3: Enter verification code</h3>
          <p className="text-sm mb-4">Enter the 6-digit code from your authenticator app to verify setup.</p>
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="Enter 6-digit code"
                className={`w-full p-2 border rounded-md ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
              {verificationError && (
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                  {verificationError}
                </p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={verifying}
                className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {verifying ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Verify and Enable
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MFASetup;