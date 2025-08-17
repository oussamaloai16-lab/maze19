import React, { useState } from 'react';
import UserService from '../services/userService';
import { X, Info } from 'lucide-react';

const AddEmployeePopup = ({ isOpen, onClose, onSuccess, theme }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST', // Default role
    authProvider: 'local',
    isVerified: false, // Default to unverified
    baseSalary: 35000
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roles = [
    'SUPER_ADMIN',
    'CHEF_DE_BUREAU',
    'RECEPTIONIST',
    'GRAPHIC_DESIGNER',
    'CONFIRMATION_TEAM',
    'ACCOUNTANT',
    'CLIENT',
    'CLOSER' // Added CLOSER role
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox input differently
    const inputValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Ensure numeric salary
      const payload = { ...formData, baseSalary: Number(formData.baseSalary) };
      await UserService.createUser(payload);
      setLoading(false);
      onSuccess(); // Notify parent component about successful creation
      onClose(); // Close the popup
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'RECEPTIONIST',
        authProvider: 'local',
        isVerified: false,
        baseSalary: 35000
      });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to create employee');
      console.error('Error creating employee:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
        
        {error && (
          <div className={`mb-4 p-3 rounded ${
            theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
          }`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Base Salary (DA)</label>
            <input
              type="number"
              name="baseSalary"
              min={0}
              step={100}
              value={formData.baseSalary}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isVerified"
                name="isVerified"
                checked={formData.isVerified}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isVerified" className="ml-2 block text-sm">
                Skip email verification
              </label>
              <div className="ml-1 group relative">
                <Info size={16} className="text-gray-400 cursor-help" />
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 w-64 p-2 rounded shadow-lg text-xs z-10 hidden group-hover:block ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  If checked, the user will be marked as verified immediately. Otherwise, they will need to verify their email address via a link sent to their inbox.
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeePopup;