import React, { useState, useEffect } from 'react';
import { X, Phone, Save, Loader2, Clock, Calendar } from 'lucide-react';
import SuggestedClientService from '../services/suggestedClientService';

const CallLogPopup = ({ isOpen, onClose, onSuccess, client, theme }) => {
  const [formData, setFormData] = useState({
    callOutcome: 'interested',
    callDuration: '',
    notes: '',
    followUpDate: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const callOutcomeOptions = [
    { value: 'interested', label: 'Interested', color: 'green' },
    { value: 'not_interested', label: 'Not Interested', color: 'red' },
    { value: 'call_back_later', label: 'Call Back Later', color: 'yellow' },
    { value: 'no_answer', label: 'No Answer', color: 'gray' },
    { value: 'invalid_number', label: 'Invalid Number', color: 'red' }
  ];

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      setFormData({
        callOutcome: 'interested',
        callDuration: '',
        notes: '',
        followUpDate: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.notes.trim()) {
      setError('Call notes are required');
      return false;
    }

    if (formData.callDuration && (isNaN(formData.callDuration) || formData.callDuration < 0)) {
      setError('Please enter a valid call duration');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        callDuration: formData.callDuration ? parseInt(formData.callDuration) : 0,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null
      };

      await SuggestedClientService.addCallLog(client._id, submitData);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add call log');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-lg ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'
            }`}>
              <Phone size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Add Call Log</h2>
              <p className="text-sm text-gray-500">{client.storeName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Client Info */}
        <div className={`p-4 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Phone:</span>
              <div className="font-medium">
                {SuggestedClientService.formatDisplayPhoneNumber(client.phoneNumber)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Total Calls:</span>
              <div className="font-medium">{client.totalCalls || 0}</div>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <div className="font-medium capitalize">{client.status}</div>
            </div>
            <div>
              <span className="text-gray-500">Priority:</span>
              <div className="font-medium capitalize">{client.priority}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className={`mb-4 p-3 rounded ${
              theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
            }`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Call Outcome */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Call Outcome <span className="text-red-500">*</span>
              </label>
              <select
                name="callOutcome"
                value={formData.callOutcome}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                disabled={loading}
              >
                {callOutcomeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Call Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Call Duration (minutes)
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="callDuration"
                  value={formData.callDuration}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="5"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Follow-up Date */}
            {(formData.callOutcome === 'call_back_later' || formData.callOutcome === 'no_answer') && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Follow-up Date
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Call Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Call Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="4"
                className={`w-full px-3 py-2 border rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Describe the conversation, client's response, next steps..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Add Call Log</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallLogPopup;
