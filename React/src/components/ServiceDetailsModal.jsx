import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { 
  X, Calendar, User, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  DollarSign, Phone, MapPin, Building, Target, Briefcase, MessageSquare
} from 'lucide-react';
import serviceApi from '../services/serviceApi';
import { toast } from 'react-toastify';

const ServiceDetailsModal = ({ isOpen, onClose, serviceId }) => {
  const { theme } = useContext(ThemeContext);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && serviceId) {
      fetchServiceDetails();
    }
  }, [isOpen, serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const response = await serviceApi.getService(serviceId);
      setService(response.service || response);
    } catch (error) {
      console.error('Error fetching service details:', error);
      toast.error('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'canceled':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    let bgColor, textColor;
    
    if (theme === 'dark') {
      if (status === 'Active') {
        bgColor = 'bg-green-900/30';
        textColor = 'text-green-400';
      } else if (status === 'Pending') {
        bgColor = 'bg-yellow-900/30';
        textColor = 'text-yellow-400';
      } else {
        bgColor = 'bg-red-900/30';
        textColor = 'text-red-400';
      }
    } else {
      if (status === 'Active') {
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
      } else if (status === 'Pending') {
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
      } else {
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
      }
    }
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${bgColor} ${textColor}`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border ${
        theme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-gray-200/50'
      } backdrop-blur-xl shadow-2xl`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h2 className="text-3xl font-bold mb-2">Service Details</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Complete service information and client details
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 ${
              theme === 'dark'
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <X className="w-6 h-6 mx-auto" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
                theme === 'dark' 
                  ? 'border-blue-500 border-t-transparent' 
                  : 'border-blue-600 border-t-transparent'
              }`} />
            </div>
          ) : service ? (
            <div className="space-y-8">

              {/* Service Overview */}
              <div className={`p-6 rounded-2xl ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold flex items-center gap-3">
                    <Briefcase className="w-6 h-6" />
                    Service Overview
                  </h3>
                  {getStatusBadge(service.serviceStatus)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Service ID
                    </label>
                    <p className={`mt-1 text-lg font-mono ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {service._id}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Service Name
                    </label>
                    <p className={`mt-1 text-lg font-semibold ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {service.serviceName || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Budget
                    </label>
                    <p className={`mt-1 text-2xl font-bold ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    } flex items-center gap-2`}>
                      <DollarSign className="w-5 h-5" />
                      {formatCurrency(service.budget)}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Created Date
                    </label>
                    <p className={`mt-1 text-lg flex items-center gap-2 ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      {formatDate(service.createdAt)}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Estimated Start Date
                    </label>
                    <p className={`mt-1 text-lg flex items-center gap-2 ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      <Clock className="w-4 h-4" />
                      {formatDate(service.estimatedStartDate)}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Priority
                    </label>
                    <p className={`mt-1 text-lg capitalize ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {service.priority || 'Medium'}
                    </p>
                  </div>
                </div>

                {service.serviceDescription && (
                  <div className="mt-6">
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Service Description
                    </label>
                    <p className={`mt-2 text-lg leading-relaxed ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {service.serviceDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Client Information */}
              <div className={`p-6 rounded-2xl ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
              }`}>
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <User className="w-6 h-6" />
                  Client Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Client Name
                    </label>
                    <p className={`mt-1 text-lg font-semibold ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {service.clientName || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Brand Name
                    </label>
                    <p className={`mt-1 text-lg font-semibold ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {service.brandName || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Phone Number
                    </label>
                    <p className={`mt-1 text-lg flex items-center gap-2 ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      <Phone className="w-4 h-4" />
                      {service.phoneNumber || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Location
                    </label>
                    <p className={`mt-1 text-lg flex items-center gap-2 ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      <MapPin className="w-4 h-4" />
                      {service.location || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Business Type
                    </label>
                    <p className={`mt-1 text-lg flex items-center gap-2 ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      <Building className="w-4 h-4" />
                      {service.businessType || 'N/A'}
                      {service.otherBusinessType && service.businessType === 'Other' && 
                        ` (${service.otherBusinessType})`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className={`p-6 rounded-2xl ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
              }`}>
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <Target className="w-6 h-6" />
                  Project Details
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Project/Product Name
                    </label>
                    <p className={`mt-1 text-xl font-semibold ${
                      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {service.projectName || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Goal and Expectations
                      </label>
                      <p className={`mt-2 text-lg leading-relaxed ${
                        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {service.goalExpectations || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Target Audience
                      </label>
                      <p className={`mt-2 text-lg leading-relaxed ${
                        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {service.targetAudience || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {service.additionalInfo && (
                    <div>
                      <label className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Additional Information
                      </label>
                      <p className={`mt-2 text-lg leading-relaxed ${
                        theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {service.additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Service not found
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end items-center p-6 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsModal; 