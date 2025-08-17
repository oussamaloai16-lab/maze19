import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { ThemeContext } from '../context/ThemeContext';

const ChangePasswordPage = () => {
  const { theme } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = formData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await authService.changePassword(oldPassword, newPassword);
      setSuccess('Password changed successfully');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-6 flex flex-col justify-center sm:py-12 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className={`relative px-4 py-10 shadow-lg sm:rounded-3xl sm:p-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="max-w-md mx-auto">
            <div className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <div className="py-8 lg:w-80 text-base leading-6 space-y-4 sm:text-lg sm:leading-7">
                <h1 className={`text-2xl font-bold mb-8 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  Change Password
                </h1>
                
                {error && (
                  <div className={`px-4 py-3 rounded relative mb-6 ${theme === 'dark' ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'}`}>
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                {success && (
                  <div className={`px-4 py-3 rounded relative mb-6 ${theme === 'dark' ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-100 border-green-400 text-green-700'}`}>
                    <span className="block sm:inline">{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-cyan-500 ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-cyan-500 ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-cyan-500 ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>

                <div className="text-sm text-center mt-6">
                  <Link 
                    to="/homepage"
                    className={`font-medium ${theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'}`}
                  >
                    Back to Homepage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;