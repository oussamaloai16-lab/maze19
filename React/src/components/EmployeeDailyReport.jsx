import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FileText, Send, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';

const EmployeeDailyReport = () => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [todayReport, setTodayReport] = useState(null);

  const API_URL = import.meta.env.VITE_BASE_URL;

  // Check if user has already submitted a report today
  useEffect(() => {
    checkTodayReport();
  }, []);

  const checkTodayReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/daily-reports/employee/my-today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHasSubmittedToday(data.data.hasSubmittedToday);
        setTodayReport(data.data.report);
        
        if (data.data.report) {
          setContent(data.data.report.content || '');
          setSummary(data.data.report.summary || '');
        }
      }
    } catch (error) {
      console.error('Error checking today\'s report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Please write your daily report content.' });
      return;
    }

    setSubmitLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/daily-reports/employee/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          summary: summary.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: hasSubmittedToday 
            ? 'Daily report updated successfully!' 
            : 'Daily report submitted successfully!' 
        });
        setHasSubmittedToday(true);
        setTodayReport(data.data.report);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit report' });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (hasSubmittedToday) {
      return (
        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
          <CheckCircle2 size={16} />
          <span>Report Submitted</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
          <Clock size={16} />
          <span>Pending Submission</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <FileText className="text-indigo-500" size={32} />
                <span>Daily Report</span>
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Submit your daily work report
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* User Info */}
        <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center space-x-3">
            <User className="text-indigo-500" size={24} />
            <div>
              <h3 className="font-semibold">{user?.username || 'Employee'}</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.role || 'Role'} • {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Report Form */}
        <form onSubmit={handleSubmit} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          {/* Summary Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Summary <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of your day's work..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Content Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Daily Report Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your daily activities, achievements, challenges, and any important notes..."
              rows={8}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <div className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {content.length} characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitLoading || !content.trim()}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                submitLoading || !content.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {submitLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send size={16} />
              )}
              <span>
                {submitLoading 
                  ? 'Submitting...' 
                  : hasSubmittedToday 
                    ? 'Update Report' 
                    : 'Submit Report'
                }
              </span>
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
            <div className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="space-y-1">
                <li>• You can submit or update your daily report until 11:00 PM</li>
                <li>• All reports will be automatically sent to Telegram at 11:00 PM</li>
                <li>• Previous reports are preserved and can be viewed in the Reports section</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDailyReport; 