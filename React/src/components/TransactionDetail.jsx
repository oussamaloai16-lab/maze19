// TransactionDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import TransactionService from '../services/transactionService';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Tag,
  CreditCard,
  FileText,
  Clock
} from 'lucide-react';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await TransactionService.getTransactionById(id);
        setTransaction(data);
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError('Failed to load transaction details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      try {
        setDeleteLoading(true);
        await TransactionService.deleteTransaction(id);
        navigate('/transactions');
      } catch (err) {
        console.error('Error deleting transaction:', err);
        setError('Failed to delete transaction. Please try again.');
        setDeleteLoading(false);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/transactions/edit/${id}`);
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'completed': 'green',
      'pending': 'yellow',
      'failed': 'red',
      'processing': 'blue',
      'refunded': 'purple'
    };
    
    return statusColors[status] || 'gray';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <RefreshCw size={32} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`p-4 rounded-lg flex items-start ${
          theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
        }`}>
          <AlertCircle size={24} className="mr-3 mt-1 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Error Loading Transaction</h2>
            <p>{error}</p>
            <button 
              onClick={handleBackClick}
              className={`mt-4 px-4 py-2 rounded ${
                theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
              } flex items-center`}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
        }`}>
          <h2 className="text-lg font-semibold mb-2">Transaction Not Found</h2>
          <p>The transaction you're looking for doesn't exist or has been deleted.</p>
          <button 
            onClick={handleBackClick}
            className={`mt-4 px-4 py-2 rounded ${
              theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            } flex items-center`}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header with back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={handleBackClick}
          className={`flex items-center ${
            theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Transactions
        </button>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            {deleteLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Transaction ID and Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Transaction #{transaction.transactionId}</h1>
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              theme === 'dark' 
                ? `bg-${getStatusColor(transaction.status)}-900 text-${getStatusColor(transaction.status)}-300` 
                : `bg-${getStatusColor(transaction.status)}-100 text-${getStatusColor(transaction.status)}-800`
            }`}>
              {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}
            </span>
            <span className="mx-2 text-gray-500">·</span>
            <span className="text-sm text-gray-500">
              Created {formatDate(transaction.date)}
            </span>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="text-3xl font-bold">
            {TransactionService.formatAmount(transaction.amount)}
          </span>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div className={`rounded-lg overflow-hidden shadow-lg mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 ${
          theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold">Transaction Details</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service */}
            <div className="flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Briefcase size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-medium">{transaction.service}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Calendar size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transaction Date</p>
                <p className="font-medium">{formatDate(transaction.date)}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <DollarSign size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{TransactionService.formatAmount(transaction.amount)}</p>
              </div>
            </div>

            {/* Client */}
            <div className="flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <User size={20} className="text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Client ID</p>
                <p className="font-medium">{transaction.clientId || 'N/A'}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <CreditCard size={20} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{transaction.paymentMethod || 'N/A'}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Tag size={20} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}</p>
              </div>
            </div>

            {/* Installment */}
            <div className="flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Clock size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Installment</p>
                <p className="font-medium">{transaction.isInstallment ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <RefreshCw size={20} className="text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(transaction.updatedAt)}</p>
              </div>
            </div>

            {/* Created By */}
            <div className="md:col-span-2 flex items-start">
              <div className={`mr-3 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <FileText size={20} className="text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium">{transaction.notes || 'No notes available'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Transactions Section */}
      {transaction.isInstallment && (
        <div className={`rounded-lg overflow-hidden shadow-lg mb-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`px-6 py-4 ${
            theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
          }`}>
            <h2 className="text-xl font-semibold">Related Installment Transactions</h2>
          </div>
          <div className="p-6">
            {transaction.relatedTransactions && transaction.relatedTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {transaction.relatedTransactions.map((relatedTx) => (
                      <tr key={relatedTx._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{relatedTx.transactionId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(relatedTx.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {TransactionService.formatAmount(relatedTx.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            theme === 'dark' 
                              ? `bg-${getStatusColor(relatedTx.status)}-900 text-${getStatusColor(relatedTx.status)}-300` 
                              : `bg-${getStatusColor(relatedTx.status)}-100 text-${getStatusColor(relatedTx.status)}-800`
                          }`}>
                            {relatedTx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => navigate(`/transactions/${relatedTx._id}`)}
                            className={`inline-flex items-center px-2 py-1 text-sm ${
                              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                            }`}
                          >
                            <ExternalLink size={14} className="mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`p-4 rounded ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <p className="text-center">No related transactions found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Information or Metadata */}
      <div className={`rounded-lg overflow-hidden shadow-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 ${
          theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold">Additional Information</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-medium break-all">{transaction.transactionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Database ID</p>
              <p className="font-medium break-all">{transaction._id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium break-all">{transaction.createdBy || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Version</p>
              <p className="font-medium">{transaction.__v || '0'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;