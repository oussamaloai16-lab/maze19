import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Save, Loader2, UserCheck, UserX } from 'lucide-react';
import SuggestedClientService from '../services/suggestedClientService';

const ValidationPopup = ({ isOpen, onClose, onSuccess, client, theme }) => {
  const [formData, setFormData] = useState({
    isValid: true,
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        isValid: !client.isValidated ? true : client.isValidated,
        notes: client.validationNotes || ''
      });
      setError('');
    }
  }, [isOpen, client]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.notes.trim()) {
      setError('Validation notes are required');
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
      await SuggestedClientService.validateClient(
        client._id, 
        formData.isValid, 
        formData.notes
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to validate client');
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
              formData.isValid 
                ? (theme === 'dark' ? 'bg-green-900' : 'bg-green-100')
                : (theme === 'dark' ? 'bg-red-900' : 'bg-red-100')
            }`}>
              {formData.isValid ? (
                <UserCheck size={20} className="text-green-500" />
              ) : (
                <UserX size={20} className="text-red-500" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">Client Validation</h2>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <PhoneNumberCell client={client} />
                </td>             
              </div>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <div className="font-medium">{client.wilaya}</div>
            </div>
            <div>
              <span className="text-gray-500">Total Calls:</span>
              <div className="font-medium">{client.totalCalls || 0}</div>
            </div>
            <div>
              <span className="text-gray-500">Current Status:</span>
              <div className="font-medium capitalize">{client.status}</div>
            </div>
          </div>

          {client.isValidated && (
            <div className={`mt-3 p-3 rounded ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-blue-500" />
                <span className="text-sm font-medium">Already validated</span>
              </div>
              {client.validationNotes && (
                <p className="text-sm mt-1 text-gray-600">{client.validationNotes}</p>
              )}
            </div>
          )}
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
            {/* Validation Decision */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Validation Decision
              </label>
              <div className="space-y-3">
                <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer ${
                  formData.isValid
                    ? (theme === 'dark' ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50')
                    : (theme === 'dark' ? 'border-gray-600' : 'border-gray-200')
                }`}>
                  <input
                    type="radio"
                    name="isValid"
                    value={true}
                    checked={formData.isValid === true}
                    onChange={() => setFormData(prev => ({ ...prev, isValid: true }))}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div className="flex items-center space-x-3">
                    <CheckCircle 
                      size={20} 
                      className={formData.isValid ? 'text-green-500' : 'text-gray-400'} 
                    />
                    <div>
                      <div className="font-medium">Validate Client</div>
                      <div className="text-sm text-gray-500">
                        Client shows potential and interest
                      </div>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer ${
                  !formData.isValid
                    ? (theme === 'dark' ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50')
                    : (theme === 'dark' ? 'border-gray-600' : 'border-gray-200')
                }`}>
                  <input
                    type="radio"
                    name="isValid"
                    value={false}
                    checked={formData.isValid === false}
                    onChange={() => setFormData(prev => ({ ...prev, isValid: false }))}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div className="flex items-center space-x-3">
                    <XCircle 
                      size={20} 
                      className={!formData.isValid ? 'text-red-500' : 'text-gray-400'} 
                    />
                    <div>
                      <div className="font-medium">Invalidate Client</div>
                      <div className="text-sm text-gray-500">
                        Client is not suitable or not interested
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Validation Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Validation Notes <span className="text-red-500">*</span>
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
                placeholder={
                  formData.isValid
                    ? "Explain why this client is validated. Include details about their interest level, budget, timeline, etc."
                    : "Explain why this client is not suitable. Include reasons like lack of interest, budget constraints, etc."
                }
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
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                formData.isValid
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{formData.isValid ? 'Validate Client' : 'Invalidate Client'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationPopup;