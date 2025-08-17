import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { X, User, Calendar, FileText, Send, Clock } from 'lucide-react';

const ReportViewModal = ({ isOpen, onClose, report, loading }) => {
  const { theme } = useContext(ThemeContext);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    let bgColor, textColor, icon;
    
    switch (status) {
      case 'sent':
        bgColor = theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100';
        textColor = theme === 'dark' ? 'text-green-400' : 'text-green-800';
        icon = <Send className="w-4 h-4" />;
        break;
      case 'generated':
        bgColor = theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100';
        textColor = theme === 'dark' ? 'text-blue-400' : 'text-blue-800';
        icon = <Clock className="w-4 h-4" />;
        break;
      default:
        bgColor = theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-100';
        textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-800';
        icon = <FileText className="w-4 h-4" />;
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {icon}
        <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Daily Report Details
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <User className="text-indigo-500" size={20} />
                  <h3 className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Employee Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Name
                    </label>
                    <p className={`mt-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {report.employeeInfo?.employeeName || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Role
                    </label>
                    <p className={`mt-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {report.employeeInfo?.employeeRole || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Info */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="text-indigo-500" size={20} />
                  <h3 className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Report Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Date
                    </label>
                    <p className={`mt-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatDate(report.reportDate)}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Status
                    </label>
                    <div className="mt-1">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {report.summary && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Summary
                  </label>
                  <div className={`p-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}>
                    {report.summary}
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Report Content
                </label>
                <div className={`p-4 rounded-lg border min-h-[200px] ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  <div className="whitespace-pre-wrap break-words">
                    {report.content}
                  </div>
                </div>
              </div>

              {/* Telegram Info */}
              {report.telegramInfo && (
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h3 className={`font-semibold mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Telegram Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Sent
                      </label>
                      <p className={`mt-1 ${
                        report.telegramInfo.sent 
                          ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
                          : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                      }`}>
                        {report.telegramInfo.sent ? 'Yes' : 'No'}
                      </p>
                    </div>
                    {report.telegramInfo.sentAt && (
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Sent At
                        </label>
                        <p className={`mt-1 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatDate(report.telegramInfo.sentAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Report not found
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
    </div>
  );
};

export default ReportViewModal; 