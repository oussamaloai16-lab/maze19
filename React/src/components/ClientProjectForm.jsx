import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  MessageSquare, 
  Camera, 
  Video, 
  Megaphone, 
  Monitor,
  Truck,
  Palette,
  Loader,
  CheckCircle
} from 'lucide-react';
import clientService from '../services/clientService';

const ClientProjectForm = ({ isOpen, onClose, theme = 'dark' }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    location: '',
    projectType: [],
    budget: '',
    timeline: '',
    description: '',
    preferredContact: 'whatsapp'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const serviceOptions = [
    { 
      value: 'photography', 
      label: 'Professional Photography', 
      icon: <Camera className="w-5 h-5" />,
      description: 'Product & brand photography'
    },
    { 
      value: 'advertising', 
      label: 'Advertising Management', 
      icon: <Megaphone className="w-5 h-5" />,
      description: 'Facebook, Instagram, Google Ads'
    },
    { 
      value: 'video', 
      label: 'Video Production', 
      icon: <Video className="w-5 h-5" />,
      description: 'Marketing videos & content'
    },
    { 
      value: 'ecommerce', 
      label: 'E-commerce Development', 
      icon: <Monitor className="w-5 h-5" />,
      description: 'Online store creation'
    },
    { 
      value: 'fulfillment', 
      label: 'Order Fulfillment', 
      icon: <Truck className="w-5 h-5" />,
      description: 'Order processing & delivery'
    },
    { 
      value: 'design', 
      label: 'Creative Design', 
      icon: <Palette className="w-5 h-5" />,
      description: 'Brand identity & graphics'
    }
  ];

  const budgetRanges = [
    { value: '10000-25000', label: '10,000 - 25,000 DZD' },
    { value: '25000-50000', label: '25,000 - 50,000 DZD' },
    { value: '50000-100000', label: '50,000 - 100,000 DZD' },
    { value: '100000+', label: '100,000+ DZD' },
    { value: 'custom', label: 'Custom Budget' }
  ];

  const timelineOptions = [
    { value: 'urgent', label: 'Urgent (1-7 days)' },
    { value: 'standard', label: 'Standard (1-2 weeks)' },
    { value: 'flexible', label: 'Flexible (2-4 weeks)' },
    { value: 'long-term', label: 'Long-term project' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleServiceToggle = (serviceValue) => {
    setFormData(prev => ({
      ...prev,
      projectType: prev.projectType.includes(serviceValue)
        ? prev.projectType.filter(s => s !== serviceValue)
        : [...prev.projectType, serviceValue]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.projectType.length === 0) newErrors.projectType = 'Please select at least one service';
    if (!formData.budget) newErrors.budget = 'Please select a budget range';
    if (!formData.timeline) newErrors.timeline = 'Please select a timeline';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await clientService.createClient(formData);
      
      if (response.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            company: '',
            location: '',
            projectType: [],
            budget: '',
            timeline: '',
            description: '',
            preferredContact: 'whatsapp'
          });
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error || 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 rounded-3xl border ${
        theme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-gray-200/50'
      } backdrop-blur-xl`}>
        
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Thank You!</h3>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Your project request has been submitted successfully. We'll contact you within 24 hours!
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Start Your Project</h2>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Tell us about your project and we'll get back to you within 24 hours
                </p>
              </div>
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 ${
                  theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+213 XXX XXX XXX"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Company/Business Name
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Your business name (optional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="City, Algeria"
                  />
                </div>
              </div>

              {/* Services Selection */}
              <div>
                <label className="block text-sm font-semibold mb-4">
                  Services Needed *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serviceOptions.map((service) => (
                    <div
                      key={service.value}
                      onClick={() => handleServiceToggle(service.value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        formData.projectType.includes(service.value)
                          ? 'border-purple-500 bg-purple-500/10'
                          : theme === 'dark'
                            ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          formData.projectType.includes(service.value)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {service.icon}
                        </div>
                        <span className="font-semibold">{service.label}</span>
                      </div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {service.description}
                      </p>
                    </div>
                  ))}
                </div>
                {errors.projectType && <p className="text-red-500 text-sm mt-2">{errors.projectType}</p>}
              </div>

              {/* Budget and Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Budget Range *</label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${errors.budget ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select budget range</option>
                    {budgetRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                  {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Timeline *</label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${errors.timeline ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select timeline</option>
                    {timelineOptions.map((timeline) => (
                      <option key={timeline.value} value={timeline.value}>
                        {timeline.label}
                      </option>
                    ))}
                  </select>
                  {errors.timeline && <p className="text-red-500 text-sm mt-1">{errors.timeline}</p>}
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Project Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Tell us more about your project, goals, and any specific requirements..."
                />
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="block text-sm font-semibold mb-2">Preferred Contact Method</label>
                <div className="flex gap-4">
                  {[
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'email', label: 'Email' },
                    { value: 'phone', label: 'Phone Call' }
                  ].map((method) => (
                    <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="preferredContact"
                        value={method.value}
                        checked={formData.preferredContact === method.value}
                        onChange={handleInputChange}
                        className="text-purple-500 focus:ring-purple-500"
                      />
                      <span>{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-500">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit Project Request'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientProjectForm; 