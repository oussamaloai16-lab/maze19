import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Check, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import TransactionService from '../services/transactionService';
import UserService from '../services/userService';

const AddTransactionPopup = ({ isOpen, onClose, onSuccess, transaction, theme }) => {
  const initialFormState = {
    transactionId: '',
    service: '',
    amount: '',
    isInstallment: false,
    clientId: '',
    status: 'pending',
    notes: '',
    paymentType: 'in', // 'in' for income, 'out' for expense
    paymentMethod: 'cash', // Keeping paymentMethod for the database
    date: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);

  // Fetch users using your existing UserService
  const fetchUsers = async () => {
    try {
      setClientsLoading(true);
      setError(null);
      
      // Use your existing UserService to get all users
      const response = await UserService.getAllUsers();
      
      // Check the structure of the response and extract the users array
      let userList = [];
      
      if (Array.isArray(response)) {
        userList = response;
      } else if (response && typeof response === 'object') {
        // If response is an object, try to find the users array
        if (Array.isArray(response.data)) {
          userList = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          userList = response.users;
        } else if (response.results && Array.isArray(response.results)) {
          userList = response.results;
        }
        // If we still don't have an array, log the response to debug
        if (userList.length === 0) {
          console.log('User service response structure:', response);
        }
      }
      
      // Filter users to show only those with CLIENT role
      const clientUsers = userList.filter(user => 
        user.role === 'CLIENT' || 
        user.role?.toLowerCase() === 'client'
      );
      
      console.log('Fetched client users:', clientUsers);
      setClients(clientUsers);
      setClientsLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load clients. Please try again.');
      setClientsLoading(false);
    }
  };


  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      
      // If editing an existing transaction
      if (transaction) {
        // Determine payment type based on amount sign
        const paymentType = transaction.amount < 0 ? 'out' : 'in';
        
        setFormData({
          transactionId: transaction.transactionId || '',
          service: transaction.service || '',
          // Convert negative amounts to positive for display
          amount: transaction.amount ? Math.abs(transaction.amount).toString() : '',
          isInstallment: transaction.isInstallment || false,
          clientId: transaction.clientId || '',
          status: transaction.status || 'pending',
          notes: transaction.notes || '',
          paymentType: paymentType, // Set payment type based on amount sign
          paymentMethod: transaction.paymentMethod || 'cash',
          date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
      } else {
        // Reset form for new transaction
        setFormData(initialFormState);
        
        // Generate a unique transaction ID
        const uniqueId = `TRX-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        setFormData(prev => ({ ...prev, transactionId: uniqueId }));
      }
    }
  }, [isOpen, transaction]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.transactionId.trim()) {
      setError('Transaction ID is required');
      return false;
    }
    
    if (!formData.service.trim()) {
      setError('Please enter a service');
      return false;
    }
    
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (!formData.clientId) {
      setError('Please select a client');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      console.log('Submitting transaction:', formData);
      
      // Format the data before sending
      // Apply sign to amount based on payment type
      let finalAmount = parseFloat(formData.amount);
      if (formData.paymentType === 'out') {
        finalAmount = -finalAmount; // Make amount negative for outgoing payments
      }
      
      const dataToSubmit = {
        ...formData,
        amount: finalAmount,
        // Preserve the paymentMethod field for the schema
        paymentMethod: formData.paymentMethod || 'cash' // Fallback to cash if not set
      };

      // Remove paymentType as it's not in the schema
      delete dataToSubmit.paymentType;

      let result;
      if (transaction) {
        // Update existing transaction
        result = await TransactionService.updateTransaction(transaction._id, dataToSubmit);
        console.log('Transaction updated:', result);
      } else {
        // Create new transaction
        result = await TransactionService.createTransaction(dataToSubmit);
        console.log('Transaction created:', result);
      }

      setLoading(false);
      onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Error in transaction submission:', err);
      setLoading(false);
      setError(typeof err === 'string' ? err : 'Failed to save transaction. Please try again.');
    }
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
            {transaction ? 'Edit Transaction' : 'Create New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className={`rounded-full p-1 hover:bg-opacity-20 ${
              theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className={`mb-4 p-3 rounded flex items-center ${
              theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
            }`}>
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Transaction ID */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Transaction ID
              </label>
              <input
                type="text"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleChange}
                required
                className={`w-full rounded-md border p-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="TRX-123456-7890"
              />
            </div>

            {/* Date */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Date
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className={`w-full rounded-md border p-2 pl-10 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Client (now using real users) */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Client
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                required
                disabled={clientsLoading}
                className={`w-full rounded-md border p-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">
                  {clientsLoading ? 'Loading clients...' : 'Select Client'}
                </option>
                {Array.isArray(clients) && clients.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.username || user.name || user.email || user._id}
                  </option>
                ))}
              </select>
              {(!Array.isArray(clients) || clients.length === 0) && !clientsLoading && !error && (
                <p className={`mt-1 text-sm ${
                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                }`}>
                  No clients found. Please add users first.
                </p>
              )}
            </div>

            {/* Service - Changed from dropdown to text input */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Service
              </label>
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className={`w-full rounded-md border p-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter service name"
              />
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Amount
              </label>
              <div className="relative">
                {formData.paymentType === 'in' ? (
                  <ArrowDownLeft size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                ) : (
                  <ArrowUpRight size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                )}
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={`w-full rounded-md border p-2 pl-10 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Payment Type (In/Out) */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Payment Type
              </label>
              <div className="flex space-x-4">
                <label className={`flex items-center ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="in"
                    checked={formData.paymentType === 'in'}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="flex items-center">
                    <ArrowDownLeft size={16} className="mr-1 text-green-500" />
                    Income
                  </span>
                </label>
                <label className={`flex items-center ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="out"
                    checked={formData.paymentType === 'out'}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="flex items-center">
                    <ArrowUpRight size={16} className="mr-1 text-red-500" />
                    Expense
                  </span>
                </label>
              </div>
            </div>
            
            {/* Payment Method */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
                className={`w-full rounded-md border p-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="cheque">Cheque</option>
                <option value="check">Check</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className={`w-full rounded-md border p-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Installment Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isInstallment"
                name="isInstallment"
                checked={formData.isInstallment}
                onChange={handleChange}
                className="mr-2 h-4 w-4"
              />
              <label 
                htmlFor="isInstallment"
                className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Installment Payment
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className={`w-full rounded-md border p-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Add transaction notes here..."
            ></textarea>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded font-medium ${
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
              className="px-4 py-2 rounded font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-1" />
                  {transaction ? 'Update Transaction' : 'Save Transaction'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionPopup;