import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { X, Plus, Minus, Calculator, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const NewServiceModal = ({ isOpen, onClose, onSubmit }) => {
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Client & Project Information
    clientName: '',
    brandName: '',
    phoneNumber: '',
    location: '',
    businessType: '',
    otherBusinessType: '',
    projectName: '',
    goalExpectations: '',
    targetAudience: '',
    additionalInfo: '',
    
    // Services Configuration
    numberOfServices: 1,
    services: [
      {
        serviceName: '',
        serviceDescription: '',
        price: ''
      }
    ],
    
    // Timeline & Budget
    totalBudget: 0,
    estimatedStartDate: '',
    projectDeadline: '',
    serviceStatus: 'Pending'
  });

  const businessTypes = [
    'E-commerce',
    'Service Industry',
    'Product Based',
    'Other'
  ];

  const availableServices = [
    'Professional Photography - Product Shooting',
    'Professional Photography - Brand Shooting', 
    'Professional Photography - Studio Shooting',
    'Professional Photography - Outdoor Shooting',
    'Video Production - Product Demo Videos',
    'Video Production - Brand Story Videos',
    'Video Production - Social Media Content',
    'Video Production - Promotional Videos',
    'Video Production - Customer Testimonials',
    'Advertising Management - Facebook Ads',
    'Advertising Management - Instagram Ads', 
    'Advertising Management - Google Ads',
    'Social Media Management - Content Creation',
    'Social Media Management - Daily Posting',
    'Social Media Management - Community Management',
    'E-commerce Development - Online Store Creation',
    'E-commerce Development - Product Catalog Setup',
    'E-commerce Development - Payment Integration',
    'Order Fulfillment - Order Processing',
    'Order Fulfillment - Inventory Management',
    'Order Fulfillment - Delivery Coordination',
    'Creative Design - Brand Identity',
    'Creative Design - Logo Design',
    'Creative Design - Graphic Design',
    'Creative Design - Marketing Materials',
    'Complete Business Package - Photography + Video + Ads + E-commerce',
    'Video Content Package - 6 Creative Videos (Different Types)'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberOfServicesChange = (e) => {
    const newCount = parseInt(e.target.value) || 1;
    const currentServices = [...formData.services];
    
    if (newCount > currentServices.length) {
      // Add new service slots
      for (let i = currentServices.length; i < newCount; i++) {
        currentServices.push({
          serviceName: '',
          serviceDescription: '',
          price: ''
        });
      }
    } else if (newCount < currentServices.length) {
      // Remove excess service slots
      currentServices.splice(newCount);
    }
    
    setFormData(prev => ({
      ...prev,
      numberOfServices: newCount,
      services: currentServices
    }));
    
    calculateTotalBudget(currentServices);
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      services: updatedServices
    }));
    
    if (field === 'price') {
      calculateTotalBudget(updatedServices);
    }
  };

  const calculateTotalBudget = (services) => {
    const total = services.reduce((sum, service) => {
      const price = parseFloat(service.price) || 0;
      return sum + price;
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      totalBudget: total
    }));
  };

  const addService = () => {
    const newServices = [...formData.services, {
      serviceName: '',
      serviceDescription: '',
      price: ''
    }];
    
    setFormData(prev => ({
      ...prev,
      numberOfServices: prev.numberOfServices + 1,
      services: newServices
    }));
  };

  const removeService = (index) => {
    if (formData.services.length > 1) {
      const newServices = formData.services.filter((_, i) => i !== index);
      
      setFormData(prev => ({
        ...prev,
        numberOfServices: prev.numberOfServices - 1,
        services: newServices
      }));
      
      calculateTotalBudget(newServices);
    }
  };

  const validateForm = () => {
    // Client information validation
    if (!formData.clientName || !formData.brandName || !formData.phoneNumber || 
        !formData.location || !formData.businessType || !formData.projectName || 
        !formData.goalExpectations || !formData.targetAudience) {
      toast.error('Please fill in all required client information fields');
      return false;
    }
    
    if (formData.businessType === 'Other' && !formData.otherBusinessType) {
      toast.error('Please specify the business type');
      return false;
    }
    
    // Services validation
    for (let i = 0; i < formData.services.length; i++) {
      const service = formData.services[i];
      if (!service.serviceName || !service.serviceDescription || !service.price) {
        toast.error(`Please complete all fields for Service ${i + 1}`);
        return false;
      }
      
      if (isNaN(parseFloat(service.price)) || parseFloat(service.price) <= 0) {
        toast.error(`Please enter a valid price for Service ${i + 1}`);
        return false;
      }
    }
    
    // Timeline validation
    if (!formData.estimatedStartDate || !formData.projectDeadline) {
      toast.error('Please fill in both estimated start date and project deadline');
      return false;
    }
    
    const startDate = new Date(formData.estimatedStartDate);
    const endDate = new Date(formData.projectDeadline);
    
    if (endDate <= startDate) {
      toast.error('Project deadline must be after the estimated start date');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Create one service record for each service the user selected
      const servicePromises = formData.services.map(async (service) => {
        const serviceData = {
          // Client information
          clientName: formData.clientName,
          brandName: formData.brandName,
          phoneNumber: formData.phoneNumber,
          location: formData.location,
          businessType: formData.businessType === 'Other' ? 'Other' : formData.businessType,
          otherBusinessType: formData.businessType === 'Other' ? formData.otherBusinessType : undefined,
          projectName: formData.projectName,
          goalExpectations: formData.goalExpectations,
          targetAudience: formData.targetAudience,
          additionalInfo: formData.additionalInfo,
          
          // Individual service details
          serviceName: service.serviceName,
          serviceDescription: service.serviceDescription,
          budget: parseFloat(service.price), // Use individual service price as budget
          
          // Timeline
          estimatedStartDate: formData.estimatedStartDate,
          
          // Status
          serviceStatus: formData.serviceStatus
        };
        
        return await onSubmit(serviceData);
      });
      
      // Wait for all services to be created
      await Promise.all(servicePromises);
      
      // Reset form
      setFormData({
        clientName: '',
        brandName: '',
        phoneNumber: '',
        location: '',
        businessType: '',
        otherBusinessType: '',
        projectName: '',
        goalExpectations: '',
        targetAudience: '',
        additionalInfo: '',
        numberOfServices: 1,
        services: [{ serviceName: '', serviceDescription: '', price: '' }],
        totalBudget: 0,
        estimatedStartDate: '',
        projectDeadline: '',
        serviceStatus: 'Pending'
      });
      
      onClose();
      
      // Show appropriate success message
      const serviceCount = formData.services.length;
      if (serviceCount === 1) {
        toast.success('Service request submitted successfully!');
      } else {
        toast.success(`${serviceCount} service requests submitted successfully!`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const serviceCount = formData.services.length;
      if (serviceCount === 1) {
        toast.error(error.message || 'Failed to submit service request');
      } else {
        toast.error(error.message || `Failed to submit service requests. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border ${
        theme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-gray-200/50'
      } backdrop-blur-xl`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h2 className="text-3xl font-bold mb-2">New Service Request</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Complete project details and service requirements
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className={`w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 ${
              theme === 'dark'
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X className="w-5 h-5 mx-auto" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Client & Project Information Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Client & Project Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Client Name *
                </label>
                <input
                  type="text"
                  name="clientName"
                  required
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Brand Name *
                </label>
                <input
                  type="text"
                  name="brandName"
                  required
                  value={formData.brandName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Type of Brand/Business *
                </label>
                <select
                  name="businessType"
                  required
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="">Select type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.businessType === 'Other' && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Specify Business Type *
                  </label>
                  <input
                    type="text"
                    name="otherBusinessType"
                    required
                    value={formData.otherBusinessType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    }`}
                    disabled={loading}
                    placeholder="Please specify..."
                  />
                </div>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Project/Product Name *
              </label>
              <input
                type="text"
                name="projectName"
                required
                value={formData.projectName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-md border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
                disabled={loading}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Goal and Expectations *
              </label>
              <textarea
                name="goalExpectations"
                required
                value={formData.goalExpectations}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 rounded-md border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
                disabled={loading}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Target Audience *
              </label>
              <textarea
                name="targetAudience"
                required
                value={formData.targetAudience}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 rounded-md border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
                disabled={loading}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Additional Information
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows="2"
                className={`w-full px-3 py-2 rounded-md border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                }`}
                disabled={loading}
                placeholder="Any additional details or special requirements..."
              />
            </div>
          </div>

          {/* Services Configuration Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Services Configuration</h3>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Calculator className="w-5 h-5" />
                <span className="font-semibold">Total: {formData.totalBudget.toLocaleString()} DZD</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  How many services do you need? *
                </label>
                <select
                  value={formData.numberOfServices}
                  onChange={handleNumberOfServicesChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={loading}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} Service{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Services List */}
            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold">Service {index + 1}</h4>
                    {formData.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark' 
                            ? 'text-red-400 hover:bg-red-900/20' 
                            : 'text-red-600 hover:bg-red-100'
                        }`}
                        disabled={loading}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Service Name *
                      </label>
                      <select
                        value={service.serviceName}
                        onChange={(e) => handleServiceChange(index, 'serviceName', e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300'
                        }`}
                        disabled={loading}
                        required
                      >
                        <option value="">Select service</option>
                        {availableServices.map((serviceName) => (
                          <option key={serviceName} value={serviceName}>
                            {serviceName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Price (DZD) *
                      </label>
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300'
                        }`}
                        disabled={loading}
                        required
                        min="0"
                        step="100"
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="md:col-span-1">
                      <label className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Service Description *
                      </label>
                      <textarea
                        value={service.serviceDescription}
                        onChange={(e) => handleServiceChange(index, 'serviceDescription', e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300'
                        }`}
                        disabled={loading}
                        required
                        rows="2"
                        placeholder="Describe the service details..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addService}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Add Another Service
              </button>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Project Timeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`flex items-center gap-2 text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Calendar className="w-4 h-4" />
                  Estimated Start Date *
                </label>
                <input
                  type="date"
                  name="estimatedStartDate"
                  required
                  value={formData.estimatedStartDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className={`flex items-center gap-2 text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Clock className="w-4 h-4" />
                  Project Deadline *
                </label>
                <input
                  type="date"
                  name="projectDeadline"
                  required
                  value={formData.projectDeadline}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                  disabled={loading}
                  min={formData.estimatedStartDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Budget: <span className="font-bold text-lg">{formData.totalBudget.toLocaleString()} DZD</span>
            </div>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating Service...' : 'Create Service Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewServiceModal; 