// components/CreditManagement.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import CreditService from '../services/creditService';
import {
  CreditCard, Plus, History, Users, RefreshCw, 
  AlertCircle, CheckCircle, DollarSign, TrendingUp
} from 'lucide-react';

const CreditManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [closers, setClosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [selectedCloser, setSelectedCloser] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [addingCredit, setAddingCredit] = useState(false);

  useEffect(() => {
    fetchClosersCredits();
  }, []);

  const fetchClosersCredits = async () => {
    try {
      setLoading(true);
      const response = await CreditService.getAllClosersCredits();
      setClosers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching closers credits:', err);
      setError(err || 'Failed to fetch closers credits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredit = async () => {
    if (!selectedCloser || !creditAmount || creditAmount <= 0) {
      alert('Please select a closer and enter a valid amount');
      return;
    }

    try {
      setAddingCredit(true);
      await CreditService.addCredits(
        selectedCloser.id, 
        parseInt(creditAmount), 
        creditReason || 'Manual recharge by admin'
      );
      
      // Refresh the data
      await fetchClosersCredits();
      
      // Reset form
      setShowAddCreditModal(false);
      setSelectedCloser(null);
      setCreditAmount('');
      setCreditReason('');
      
      alert(`Successfully added ${creditAmount} credits to ${selectedCloser.username}`);
    } catch (err) {
      console.error('Error adding credits:', err);
      alert(err || 'Failed to add credits');
    } finally {
      setAddingCredit(false);
    }
  };

  const handleInitializeCredits = async () => {
    const confirmed = window.confirm(
      'This will initialize 100 credits for all closers who don\'t have credits set up. Continue?'
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await CreditService.initializeCredits();
      alert(response.message);
      await fetchClosersCredits();
    } catch (err) {
      console.error('Error initializing credits:', err);
      alert(err || 'Failed to initialize credits');
    } finally {
      setLoading(false);
    }
  };

  const getCreditStatusColor = (credits) => {
    if (credits.current > 50) return 'text-green-600 bg-green-50';
    if (credits.current > 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCreditStatusIcon = (credits) => {
    if (credits.current > 50) return <CheckCircle size={16} className="text-green-500" />;
    if (credits.current > 20) return <TrendingUp size={16} className="text-yellow-500" />;
    return <AlertCircle size={16} className="text-red-500" />;
  };

  if (loading) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex justify-center items-center h-64">
          <RefreshCw size={32} className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center">
            <CreditCard className="mr-3" size={28} />
            Credit Management
          </h1>
          <p className="text-gray-500 mt-1">Manage credits for all closers</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleInitializeCredits}
            className="flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            <Users size={18} />
            Initialize All
          </button>
          
          <button
            onClick={() => setShowAddCreditModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Credits
          </button>
          
          <button
            onClick={fetchClosersCredits}
            className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className={`mb-4 p-3 rounded ${
          theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Closers</p>
              <p className="text-3xl font-semibold">{closers.length}</p>
            </div>
            <Users size={24} className="text-blue-500" />
          </div>
        </div>

        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Credits</p>
              <p className="text-3xl font-semibold">
                {closers.reduce((sum, closer) => sum + closer.credits.current, 0)}
              </p>
            </div>
            <CreditCard size={24} className="text-green-500" />
          </div>
        </div>

        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Credit Users</p>
              <p className="text-3xl font-semibold text-red-500">
                {closers.filter(closer => closer.credits.current <= 20).length}
              </p>
            </div>
            <AlertCircle size={24} className="text-red-500" />
          </div>
        </div>

        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Credits Used</p>
              <p className="text-3xl font-semibold">
                {closers.reduce((sum, closer) => sum + closer.credits.used, 0)}
              </p>
            </div>
            <TrendingUp size={24} className="text-purple-500" />
          </div>
        </div>
      </div>

      {/* Closers Table */}
      <div className={`overflow-hidden rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Closer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Current Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Used Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Usage %</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Recharge</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {closers.map((closer) => (
                <tr key={closer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        }`}>
                          <span className="text-xs font-medium">
                            {closer.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium">{closer.username}</div>
                        <div className="text-sm text-gray-500">{closer.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCreditStatusIcon(closer.credits)}
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                        getCreditStatusColor(closer.credits)
                      }`}>
                        {closer.credits.current}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {closer.credits.total}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {closer.credits.used}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            closer.credits.percentage > 50 ? 'bg-green-500' :
                            closer.credits.percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, closer.credits.percentage)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {closer.credits.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {closer.credits.lastRecharge 
                      ? new Date(closer.credits.lastRecharge).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedCloser(closer);
                        setShowAddCreditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Add Credits
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement credit history view
                        alert('Credit history feature coming soon!');
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <History size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Credit Modal */}
      {showAddCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md rounded-lg ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className={`flex justify-between items-center p-6 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className="text-xl font-semibold">Add Credits</h2>
              <button
                onClick={() => {
                  setShowAddCreditModal(false);
                  setSelectedCloser(null);
                  setCreditAmount('');
                  setCreditReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Closer
                  </label>
                  <select
                    value={selectedCloser?.id || ''}
                    onChange={(e) => {
                      const closer = closers.find(c => c.id === e.target.value);
                      setSelectedCloser(closer);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select a closer</option>
                    {closers.map((closer) => (
                      <option key={closer.id} value={closer.id}>
                        {closer.username} (Current: {closer.credits.current})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter credit amount"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="Reason for adding credits"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className={`flex justify-end space-x-3 p-6 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setShowAddCreditModal(false);
                  setSelectedCloser(null);
                  setCreditAmount('');
                  setCreditReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCredit}
                disabled={addingCredit || !selectedCloser || !creditAmount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {addingCredit && <RefreshCw size={16} className="animate-spin mr-2" />}
                Add Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;