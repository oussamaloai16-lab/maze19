import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import SuggestedClientService from '../services/suggestedClientService';
import { 
  PlusCircle, X, User, MapPin, Building2, Star, DollarSign,
  Phone, Mail, Calendar, Clock, CheckCircle, AlertCircle
} from 'lucide-react';

const AddSuggestedClientPopup = ({ isOpen, onClose, onSuccess, client = null, theme }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    wilaya: '',
    commune: '',
    businessType: '',
    priority: 'medium',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wilayaOptions, setWilayaOptions] = useState([]);
  const [communeOptions, setCommuneOptions] = useState([]);

  // Load wilayas from API
  useEffect(() => {
    const fetchWilayas = async () => {
      try {
        const response = await SuggestedClientService.getUniqueWilayas();
        setWilayaOptions(response.data || []);
      } catch (error) {
        console.error('Error fetching wilayas:', error);
        setWilayaOptions([]);
      }
    };

    if (isOpen) {
      fetchWilayas();
    }
  }, [isOpen]);

  // Update commune options when wilaya changes
  useEffect(() => {
    if (formData.wilaya) {
      // For now, we'll use a simple approach - you can enhance this later
      setCommuneOptions(['Select commune...']);
    } else {
      setCommuneOptions([]);
    }
  }, [formData.wilaya]);

  // Debug user authentication state and clear errors when popup opens
  useEffect(() => {
    if (isOpen) {
      // Clear any previous errors when popup opens
      setError(null);
      
      console.log('AddSuggestedClientPopup opened - User state:', {
        authUser: user,
        localStorageUserData: localStorage.getItem('userData'),
        localStorageUser: localStorage.getItem('user'),
        token: localStorage.getItem('token') ? 'Present' : 'Missing'
      });
      
      // Test user data retrieval
      let testCurrentUser = user;
      if (!testCurrentUser) {
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            testCurrentUser = JSON.parse(userData);
            console.log('Successfully parsed userData:', testCurrentUser);
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        }
      }
      if (!testCurrentUser) {
        const userLegacy = localStorage.getItem('user');
        if (userLegacy) {
          try {
            testCurrentUser = JSON.parse(userLegacy);
            console.log('Successfully parsed legacy user:', testCurrentUser);
          } catch (e) {
            console.error('Error parsing legacy user:', e);
          }
        }
      }
      
      console.log('Final test user result:', testCurrentUser);
    }
  }, [isOpen, user]);

  // Initialize form data when client prop changes
  useEffect(() => {
    if (client) {
      // Editing existing client
      setFormData({
        storeName: client.storeName || '',
        storeAddress: client.storeAddress || '',
        wilaya: client.wilaya || '',
        commune: client.commune || '',
        phoneNumber: client.phoneNumber || '',
        socialMediaLink: client.socialMediaLink || '',
        businessType: client.businessType || '',
        estimatedBudget: client.estimatedBudget || '',
        priority: client.priority || 'medium',
        tags: client.tags ? (Array.isArray(client.tags) ? client.tags.join(', ') : client.tags) : '',
        notes: client.notes || client.validationNotes || ''
      });
    } else {
      // Creating new client
      setFormData({
        storeName: '',
        storeAddress: '',
        wilaya: '',
        commune: '',
        phoneNumber: '',
        socialMediaLink: '',
        businessType: '',
        estimatedBudget: '',
        priority: 'medium',
        tags: '',
        notes: ''
      });
    }
    setError(null);
  }, [client, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.storeName.trim()) {
      errors.push('Store name is required');
    }
    
    if (!formData.storeAddress.trim()) {
      errors.push('Store address is required');
    }
    
    if (!formData.wilaya) {
      errors.push('Wilaya is required');
    }
    
    if (!formData.commune) {
      errors.push('Commune is required');
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.push('Phone number is required');
    }
    
    // Validate phone number format
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (formData.phoneNumber.trim() && !phoneRegex.test(formData.phoneNumber)) {
      errors.push('Invalid phone number format');
    }
    
    // Validate social media link if provided
    if (formData.socialMediaLink.trim()) {
      try {
        new URL(formData.socialMediaLink);
      } catch {
        errors.push('Invalid social media URL format');
      }
    }
    
    // Validate estimated budget if provided
    if (formData.estimatedBudget) {
      const budget = parseFloat(formData.estimatedBudget);
      if (isNaN(budget) || budget < 0) {
        errors.push('Estimated budget must be a positive number');
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for submission - Try multiple sources for user data
      let currentUser = user;
      
      if (!currentUser) {
        // Try userData from localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            currentUser = JSON.parse(userData);
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        }
      }
      
      if (!currentUser) {
        // Try legacy 'user' key from localStorage
        const userLegacy = localStorage.getItem('user');
        if (userLegacy) {
          try {
            currentUser = JSON.parse(userLegacy);
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
      }
      
      // Log user information for debugging - but don't block submission
      const userId = currentUser?._id || currentUser?.id || currentUser?.userId;
      const userToken = localStorage.getItem('token');
      
      console.log('User information during submission:', { 
        currentUser,
        userId: userId, 
        username: currentUser?.username || currentUser?.name,
        email: currentUser?.email,
        role: currentUser?.role,
        hasToken: !!userToken,
        userKeys: currentUser ? Object.keys(currentUser) : [],
        authContextUser: user
      });
      
      // Only validate if we absolutely have no authentication data
      if (!currentUser && !userToken) {
        console.error('No authentication data available');
        setError('Authentication required. Please log in again.');
        return;
      }
        
      const submitData = {
        storeName: formData.storeName.trim(),
        storeAddress: formData.storeAddress.trim(),
        wilaya: formData.wilaya,
        commune: formData.commune,
        phoneNumber: formData.phoneNumber.trim(),
        socialMediaLink: formData.socialMediaLink.trim(),
        businessType: formData.businessType.trim() || 'Other',
        priority: formData.priority,
        notes: formData.notes.trim()
      };
      
      // Handle estimated budget
      if (formData.estimatedBudget) {
        const budget = parseFloat(formData.estimatedBudget);
        if (!isNaN(budget) && budget >= 0) {
          submitData.estimatedBudget = budget;
        }
      }
      
      // Handle tags
      if (formData.tags.trim()) {
        submitData.tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
      
      let response;
      if (client) {
        // Update existing client
        response = await SuggestedClientService.updateSuggestedClient(client._id, submitData);
      } else {
        // Create new client
        response = await SuggestedClientService.createSuggestedClient(submitData);
      }
      
      console.log('Suggested client saved successfully:', response);
      
      // Call success callback
      if (typeof onSuccess === 'function') {
        onSuccess(response);
      }
      
      // Close the popup
      onClose();
      
    } catch (err) {
      console.error('Error saving suggested client:', err);
      setError(err.message || 'Failed to save suggested client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      storeName: '',
      storeAddress: '',
      wilaya: '',
      commune: '',
      phoneNumber: '',
      socialMediaLink: '',
      businessType: '',
      estimatedBudget: '',
      priority: 'medium',
      tags: '',
      notes: ''
    });
    setError(null);
    setSelectedCommunes([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold">
            {client ? 'Edit Suggested Client' : 'Add New Suggested Client'}
          </h2>
          <button
            onClick={handleClose}
            className={`rounded-full p-1 hover:bg-opacity-20 ${
              theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className={`mb-4 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
            }`}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter store name"
                required
              />
            </div>

            {/* Store Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Store Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="storeAddress"
                value={formData.storeAddress}
                onChange={handleInputChange}
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter complete store address"
                required
              />
            </div>

            {/* Wilaya */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Wilaya <span className="text-red-500">*</span>
              </label>
              <select
                name="wilaya"
                value={formData.wilaya}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              >
                <option value="">Select Wilaya</option>
                {wilayaOptions.map(wilaya => (
                  <option key={wilaya} value={wilaya}>
                    {wilaya}
                  </option>
                ))}
              </select>
            </div>

            {/* Commune */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Commune <span className="text-red-500">*</span>
              </label>
              <select
                name="commune"
                value={formData.commune}
                onChange={handleInputChange}
                disabled={!formData.wilaya}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !formData.wilaya ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                required
              >
                <option value="">
                  {formData.wilaya ? 'Select Commune' : 'Select Wilaya first'}
                </option>
                {communeOptions.map(commune => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="0555123456"
                required
              />
            </div>

            {/* Social Media Link */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Social Media Link
              </label>
              <input
                type="url"
                name="socialMediaLink"
                value={formData.socialMediaLink}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="https://facebook.com/store"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Business Type
              </label>
              <input
                type="text"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., Retail Store, Restaurant, E-commerce"
              />
            </div>

            {/* Estimated Budget */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Estimated Budget (DA)
              </label>
              <input
                type="number"
                name="estimatedBudget"
                value={formData.estimatedBudget}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="50000"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="fashion, boutique, retail (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Additional notes about the client..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg font-medium ${
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
              className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                loading
                  ? (theme === 'dark' ? 'bg-blue-800/50 text-blue-300/50' : 'bg-blue-300 text-white')
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  {client ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  {client ? 'Update Client' : 'Create Client'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSuggestedClientPopup;