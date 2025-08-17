import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import SuggestedClientService from '../services/suggestedClientService';
import UserService from '../services/userService';
import AddSuggestedClientPopup from '../components/AddSuggestedClientPopup';
import CallLogPopup from '../components/CallLogPopup';
import ValidationPopup from '../components/ValidationPopup';
import SuggestedClientExcelImporter from '../components/SuggestedClientExcelImporter';
import { 
  PlusCircle, Pencil, Trash2, Search, ArrowUpDown, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Download, MoreHorizontal,
  Filter, FileSpreadsheet, FileText, DollarSign, Phone,
  ArrowDownLeft, ArrowUpRight, Upload, Trash, Check, X, ChevronDown,
  PhoneCall, UserCheck, UserX, MapPin, Building2, Star,AlertCircle, Eye, CreditCard,
  // NEW ICONS FOR MODALS
  MessageSquare, FileCheck,History, ClipboardList, Briefcase
} from 'lucide-react';
import CreditService from '../services/creditService';
import {
    suggestedClientExportHeaders,
    prepareSuggestedClientsForExport,
    downloadCSV,
    downloadExcel,
    exportFilteredClients,
    exportStatsSummary
  } from '../utils/suggestedClientExportUtils';

const SuggestedClientsManagement = () => {
  const { theme } = useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creditStatus, setCreditStatus] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [currentUser, setCurrentUser] = useState(null);
  
  // NEW MODAL STATES
  const [showCallLogsModal, setShowCallLogsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showClientDetailsModal, setShowClientDetailsModal] = useState(false);
  const [clientCallLogs, setClientCallLogs] = useState([]);
  const [loadingCallLogs, setLoadingCallLogs] = useState(false);
  
  // EXISTING MODAL STATES
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isCallLogOpen, setIsCallLogOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isExcelImporterOpen, setIsExcelImporterOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    wilaya: '',
    priority: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
    scoreRange: '',
    search: '',
    businessType: ''
  });
  const [currentClient, setCurrentClient] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const exportMenuRef = useRef(null);
  const [revealedPhones, setRevealedPhones] = useState({});
  const [phoneRevealLoading, setPhoneRevealLoading] = useState({});
  const [uniqueBusinessTypes, setUniqueBusinessTypes] = useState([]);
  const [uniqueWilayas, setUniqueWilayas] = useState([]);
  
  // State for dropdown management
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState(null);
  const statusDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  
  // User data state for names
  const [usersMap, setUsersMap] = useState({});
  
  // User call statistics
  const [userCallStats, setUserCallStats] = useState(null);
  const [loadingCallStats, setLoadingCallStats] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingClients: 0,
    contactedClients: 0,
    interestedClients: 0,
    validatedClients: 0,
    conversionRate: 0
  });

  // Status options for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'gray' },
    { value: 'contacted', label: 'Contacted', color: 'blue' },
    { value: 'interested', label: 'Interested', color: 'green' },
    { value: 'not_interested', label: 'Not Interested', color: 'red' },
    { value: 'validated', label: 'Validated', color: 'emerald' },
    { value: 'converted', label: 'Converted', color: 'purple' }
  ];

  // Priority options for dropdown
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  // Score range options for dropdown
  const scoreRangeOptions = [
    { value: 'low', label: 'Low (< 100)', color: 'gray', credits: 1 },
    { value: 'medium', label: 'Medium (100-400)', color: 'blue', credits: 2 },
    { value: 'high', label: 'High (> 400)', color: 'green', credits: 3 }
  ];

  // NEW HANDLER FUNCTIONS FOR MODALS
  // Replace your handleViewCallLogs function with this fixed version:


 const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    
    const phoneStr = phone.toString().trim();
    if (phoneStr === '') return 'N/A';
    
    // If it already has spaces or formatting, return as-is
    if (phoneStr.includes(' ') || phoneStr.includes('-')) {
      return phoneStr;
    }
    
    // Simple formatting for Algerian numbers
    const cleanNumber = phoneStr.replace(/[^\d]/g, '');
    if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4, 6)} ${cleanNumber.slice(6, 8)} ${cleanNumber.slice(8, 10)}`;
    } else if (cleanNumber.length === 9) {
      // Add leading 0 and format
      const withZero = '0' + cleanNumber;
      return `${withZero.slice(0, 4)} ${withZero.slice(4, 6)} ${withZero.slice(6, 8)} ${withZero.slice(8, 10)}`;
    }
    
    return phoneStr;
  };

  // Phone reveal handler function
  const handleRevealPhoneNumber = async (client) => {
    const clientId = client._id || client.suggestedClientId;
    
    console.log(`Starting phone reveal for client: ${clientId}`);
    
    // Allow non-closers to see phone numbers without credit deduction
    if (userRole !== 'CLOSER') {
      const formattedNumber = formatPhoneNumber(client.phoneNumber);
      console.log(`Non-closer revealing phone: ${formattedNumber}`);
      
      setRevealedPhones(prev => ({
        ...prev,
        [clientId]: formattedNumber
      }));
      return;
    }

    // Calculate credit cost based on client score
    const clientScore = client.score || 0;
    let creditCost = 1;
    let scoreCategory = 'Low';
    
    if (clientScore < 100) {
      creditCost = 1;
      scoreCategory = 'Low';
    } else if (clientScore >= 100 && clientScore <= 400) {
      creditCost = 2;
      scoreCategory = 'Medium';
    } else if (clientScore > 400) {
      creditCost = 3;
      scoreCategory = 'High';
    }

    // Check if closer has sufficient credits
    if (!creditStatus || creditStatus.current < creditCost) {
      alert(`Insufficient credits! You need ${creditCost} credits to reveal this phone number.\n\nClient Score: ${clientScore} (${scoreCategory})\nRequired Credits: ${creditCost}\nYour Credits: ${creditStatus?.current || 0}\n\nPlease contact your administrator to recharge your account.`);
      return;
    }

    const confirmed = window.confirm(
      `Reveal phone number for ${scoreCategory} score client?\n\nClient: ${client.storeName}\nScore: ${clientScore} (${scoreCategory})\nCredit Cost: ${creditCost} credits\n\nCurrent credits: ${creditStatus?.current || 0}\nAfter reveal: ${(creditStatus?.current || 0) - creditCost}`
    );

    if (!confirmed) return;

    // Set loading state
    setPhoneRevealLoading(prev => ({ ...prev, [clientId]: true }));

    try {
      console.log(`Calling API for client: ${clientId}`);
      const response = await CreditService.revealPhoneNumber(client._id);
      console.log(`API Response for ${clientId}:`, response);
      
      // Extract phone number from response
      let revealedPhone = '';
      if (response && response.data && response.data.phoneNumber) {
        revealedPhone = response.data.phoneNumber;
      } else if (response && response.phoneNumber) {
        revealedPhone = response.phoneNumber;
      }
      
      console.log(`Extracted phone for ${clientId}:`, revealedPhone);
      
      if (!revealedPhone) {
        throw new Error('No phone number received from server');
      }
      
      // Format the phone number
      const formattedNumber = formatPhoneNumber(revealedPhone);
      console.log(`Formatted phone for ${clientId}:`, formattedNumber);
      
      // Update revealed phones state
      setRevealedPhones(prev => {
        const newState = {
          ...prev,
          [clientId]: formattedNumber
        };
        console.log(`Updated revealedPhones state:`, newState);
        return newState;
      });
      
      // Update credit status
      setCreditStatus(prev => ({
        ...prev,
        current: response.data?.creditsRemaining || (prev?.current - 1)
      }));

      console.log(`Successfully revealed phone for ${clientId}: ${formattedNumber}`);
      
    } catch (error) {
      console.error(`Error revealing phone for ${clientId}:`, error);
      alert(error.message || 'Failed to reveal phone number. Please try again.');
    } finally {
      // Clear loading state
      setPhoneRevealLoading(prev => ({ ...prev, [clientId]: false }));
    }
  };

const handleViewCallLogs = async (client) => {
    setCurrentClient(client);
    setLoadingCallLogs(true);
    setShowCallLogsModal(true);
    
    try {
      console.log('Fetching call logs for client:', client._id);
      const response = await SuggestedClientService.getCallLogs(client._id);
      console.log('Call logs API response:', response);
      
      // Handle different possible response structures
      let callLogs = [];
      if (response && response.data && response.data.callLogs) {
        callLogs = response.data.callLogs;
      } else if (response && response.callLogs) {
        callLogs = response.callLogs;
      } else if (Array.isArray(response)) {
        callLogs = response;
      } else if (response && Array.isArray(response.data)) {
        callLogs = response.data;
      }
      
      console.log('Processed call logs:', callLogs);
      setClientCallLogs(callLogs);
    } catch (error) {
      console.error('Error fetching call logs:', error);
      setClientCallLogs([]);
    } finally {
      setLoadingCallLogs(false);
    }
  };

  const handleViewNotes = (client) => {
    setCurrentClient(client);
    setShowNotesModal(true);
  };

  const handleViewClientDetails = (client) => {
    setCurrentClient(client);
    setShowClientDetailsModal(true);
  };

  // Handle status update for a client
  const handleStatusUpdate = async (clientId, newStatus) => {
    try {
      setLoading(true);
      await SuggestedClientService.updateSuggestedClient(clientId, { status: newStatus });
      
      setClients(prevClients => 
        prevClients.map(client => 
          client._id === clientId || client.suggestedClientId === clientId 
            ? { ...client, status: newStatus } 
            : client
        )
      );

      setOpenStatusDropdown(null);
      setError(null);
      fetchClients();
    } catch (err) {
      console.error('Error updating client status:', err);
      setError(`Failed to update client status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const LowCreditWarning = () => {
  if (userRole !== 'CLOSER' || !creditStatus || creditStatus.current > 5) {
    return null;
  }

  return (
    <div className={`mb-4 p-3 rounded-lg border ${
      creditStatus.current === 0 
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }`}>
      <div className="flex items-center space-x-2">
        <AlertCircle size={20} />
        <div>
          <p className="font-medium">
            {creditStatus.current === 0 
              ? 'No Credits Remaining!'
              : `Low Credit Warning - ${creditStatus.current} credits remaining`
            }
          </p>
          <p className="text-sm">
            {creditStatus.current === 0 
              ? 'You cannot reveal any phone numbers. Please contact your administrator to recharge.'
              : 'Please contact your administrator to recharge your credits soon.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

  // Handle export functions
  const handleExportCSV = () => {
    try {
      const result = exportFilteredClients(clients, activeTab, searchTerm, 'csv');
      console.log(`Exported ${result.totalExported} clients to ${result.filename}`);
      setShowExportMenu(false);
      
      // Show success message (you can add a toast notification here)
      alert(`Successfully exported ${result.totalExported} clients to CSV`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setError('Failed to export data to CSV');
    }
  };
  
  const handleExportExcel = () => {
    try {
      const result = exportFilteredClients(clients, activeTab, searchTerm, 'excel');
      console.log(`Exported ${result.totalExported} clients to ${result.filename}`);
      setShowExportMenu(false);
      
      // Show success message (you can add a toast notification here)
      alert(`Successfully exported ${result.totalExported} clients to Excel (CSV format)`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export data to Excel');
    }
  };
  
  const handleExportStats = () => {
    try {
      const result = exportStatsSummary(stats, dateRange);
      console.log(`Exported statistics to ${result.filename}`);
      setShowExportMenu(false);
      
      // Show success message
      alert(`Successfully exported statistics summary`);
    } catch (error) {
      console.error('Error exporting statistics:', error);
      setError('Failed to export statistics');
    }
  };

  // Handle priority update for a client
  const handlePriorityUpdate = async (clientId, newPriority) => {
    try {
      setLoading(true);
      await SuggestedClientService.updateSuggestedClient(clientId, { priority: newPriority });
      
      setClients(prevClients => 
        prevClients.map(client => 
          client._id === clientId || client.suggestedClientId === clientId 
            ? { ...client, priority: newPriority } 
            : client
        )
      );

      setOpenPriorityDropdown(null);
      setError(null);
      fetchClients();
    } catch (err) {
      console.error('Error updating client priority:', err);
      setError(`Failed to update client priority: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllClients = async () => {
    try {
      await SuggestedClientService.deleteAllSuggestedClients();
      fetchClients();
      setError(null);
    } catch (err) {
      console.error('Error deleting all clients:', err);
      setError('Failed to delete all clients. Please try again.');
    }
  };

  // Import handlers
  const handleOpenExcelImporter = () => {
    setIsExcelImporterOpen(true);
  };

  const handleImportSuccess = () => {
    fetchClients();
  };
  // Confirmation dialog component
  const DeleteAllConfirmationDialog = () => {
    if (!showDeleteAllConfirmation) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} max-w-md`}>
          <h3 className="text-xl font-bold mb-4">Delete All Suggested Clients</h3>
          <p className="mb-6">Are you sure you want to delete all suggested clients? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setShowDeleteAllConfirmation(false)}
              className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                handleDeleteAllClients();
                setShowDeleteAllConfirmation(false);
              }}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete All
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Call Logs Modal Component
  const CallLogsModal = () => {
    if (!showCallLogsModal || !currentClient) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex justify-between items-center p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <History size={24} className="text-purple-500" />
              <div>
                <h2 className="text-xl font-semibold">Call History</h2>
                <p className="text-sm text-gray-500">{currentClient.storeName}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCallLogsModal(false)}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>
  
          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {loadingCallLogs ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin" />
              </div>
            ) : clientCallLogs && clientCallLogs.length > 0 ? (
              <div className="space-y-4">
                {clientCallLogs.map((log, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          log.callOutcome === 'interested' 
                            ? 'bg-green-100 text-green-800' 
                            : log.callOutcome === 'not_interested'
                            ? 'bg-red-100 text-red-800'
                            : log.callOutcome === 'call_back_later'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {log.callOutcome?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                        </span>
                        {log.callDuration > 0 && (
                          <span className="text-sm text-gray-500">
                            {log.callDuration} min
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {log.callDate ? formatDate(log.callDate) : 'No date'}
                      </span>
                    </div>
                    <p className="text-sm">{log.notes || 'No notes'}</p>
                    {log.followUpDate && (
                      <div className="mt-2 text-sm text-blue-600">
                        Follow-up: {formatDate(log.followUpDate)}
                      </div>
                    )}
                    {log.calledBy && (
                      <div className="mt-2 text-xs text-gray-500">
                        Called by: {log.calledBy.username || log.calledBy.name || log.calledBy.email || 'Unknown'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-4">
                  <Phone size={48} className="mx-auto text-gray-300" />
                </div>
                <p className="text-lg font-medium">No call logs found</p>
                <p className="text-sm">This client hasn't been called yet.</p>
              </div>
            )}
          </div>
  
          {/* Footer */}
          <div className={`flex justify-end p-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={() => {
                setShowCallLogsModal(false);
                handleAddCallLog(currentClient);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PhoneCall size={16} />
              <span>Add New Call</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Validation Notes Modal Component
  const NotesModal = () => {
    if (!showNotesModal || !currentClient) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-2xl rounded-lg ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex justify-between items-center p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <FileCheck size={24} className={currentClient.isValidated ? "text-green-500" : "text-yellow-500"} />
              <div>
                <h2 className="text-xl font-semibold">Validation Notes</h2>
                <p className="text-sm text-gray-500">{currentClient.storeName}</p>
              </div>
            </div>
            <button
              onClick={() => setShowNotesModal(false)}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  currentClient.isValidated 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentClient.isValidated ? 'Validated' : 'Pending Validation'}
                </span>
              </div>

              {currentClient.validatedAt && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Validated On:</span>
                  <span>{SuggestedClientService.formatDetailedDate(currentClient.validatedAt)}</span>
                </div>
              )}

              {currentClient.validatorName && currentClient.validatorName !== 'N/A' && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Validated By:</span>
                  <span>{currentClient.validatorName}</span>
                </div>
              )}

              {currentClient.validationNotes && (
                <div>
                  <span className="font-medium block mb-2">Notes:</span>
                  <div className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className="whitespace-pre-wrap">{currentClient.validationNotes}</p>
                  </div>
                </div>
              )}

              {!currentClient.validationNotes && (
                <div className="text-center py-4 text-gray-500">
                  No validation notes available
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`flex justify-end p-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={() => {
                setShowNotesModal(false);
                handleValidateClient(currentClient);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <UserCheck size={16} />
              <span>{currentClient.isValidated ? 'Update Validation' : 'Validate Client'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Client Details Modal Component
  const ClientDetailsModal = () => {
    if (!showClientDetailsModal || !currentClient) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex justify-between items-center p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Eye size={24} className="text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold">Client Details</h2>
                <p className="text-sm text-gray-500">{currentClient.storeName}</p>
              </div>
            </div>
            <button
              onClick={() => setShowClientDetailsModal(false)}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Store Name:</span>
                    <p>{currentClient.storeName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>
                    <p>{currentClient.storeAddress}</p>
                  </div>
                  <div>
                    <span className="font-medium">Wilaya:</span>
                    <p>{currentClient.wilaya}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{SuggestedClientService.formatDisplayPhoneNumber(currentClient.phoneNumber)}</p>
                  </div>
                  {currentClient.socialMediaLink && (
                    <div>
                      <span className="font-medium">Social Media:</span>
                      <a href={currentClient.socialMediaLink} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-500 hover:underline block">
                        {currentClient.socialMediaLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Business Type:</span>
                    <p>{currentClient.businessType}</p>
                  </div>
                  {currentClient.estimatedBudget && (
                    <div>
                      <span className="font-medium">Estimated Budget:</span>
                      <p>{currentClient.estimatedBudget.toLocaleString()} DA</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Priority:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      getPriorityBadge(currentClient.priority).props.className
                    }`}>
                      {currentClient.priority}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      getStatusBadge(currentClient.status).props.className
                    }`}>
                      {currentClient.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {currentClient.tags && currentClient.tags.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentClient.tags.map((tag, index) => (
                      <span key={index} className={`px-2 py-1 text-xs rounded-full ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="text-sm text-gray-500">Total Calls</div>
                    <div className="text-xl font-semibold">{currentClient.totalCalls || 0}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="text-sm text-gray-500">Validated</div>
                    <div className="text-xl font-semibold">{currentClient.isValidated ? 'Yes' : 'No'}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="text-sm">{SuggestedClientService.formatDate(currentClient.createdAt)}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="text-sm text-gray-500">Assigned To</div>
                    <div className="text-sm">{currentClient.assignedToName || 'Unassigned'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Fetch users data to map IDs to names
  const fetchUsers = async () => {
    try {
      const response = await UserService.getAllUsers();
      console.log('Users API response:', response);
      
      if (response && response.data && response.data.users) {
        const usersList = response.data.users;
        const map = {};
        usersList.forEach(user => {
          map[user._id] = user.username || user.name || user.email;
        });
        setUsersMap(map);
        console.log('Users map created:', map);
      } else {
        console.warn('No users data found in response');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchUniqueBusinessTypes = async () => {
    try {
      const response = await SuggestedClientService.getUniqueBusinessTypes();
      console.log('Business types API response:', response);
      
      if (response && response.data) {
        setUniqueBusinessTypes(response.data);
        console.log('Business types loaded:', response.data);
      } else {
        console.warn('No business types data found in response');
      }
    } catch (err) {
      console.error('Error fetching business types:', err);
      setUniqueBusinessTypes([]);
    }
  };

  const fetchUniqueWilayas = async () => {
    try {
      const response = await SuggestedClientService.getUniqueWilayas();
      console.log('Wilayas API response:', response);
      
      if (response && response.data) {
        setUniqueWilayas(response.data);
        console.log('Wilayas loaded:', response.data);
      } else {
        console.warn('No wilayas data found in response');
      }
    } catch (err) {
      console.error('Error fetching wilayas:', err);
      setUniqueWilayas([]);
    }
  };

  // Add this after the fetchUsers function (around line 430)
const fetchCreditStatus = async () => {
  try {
    console.log('🔄 Fetching credit status...');
    const response = await CreditService.getCreditStatus();
    console.log('💳 Credit status response:', response);
    
    if (response && response.data) {
      setCreditStatus(response.data);
      console.log('✅ Credit status set:', response.data);
    } else {
      console.log('❌ Invalid credit response format:', response);
      setCreditStatus(null);
    }
  } catch (error) {
    console.error('❌ Error fetching credit status:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    setCreditStatus(null);
  }
};

// Fetch user call statistics
const fetchUserCallStats = async () => {
  try {
    setLoadingCallStats(true);
    const response = await UserService.getCallStats();
    console.log('User call stats response:', response);
    setUserCallStats(response.data);
  } catch (error) {
    console.error('Error fetching user call stats:', error);
    setUserCallStats(null);
  } finally {
    setLoadingCallStats(false);
  }
};

// Phone Number Cell Component with Credit System
const PhoneNumberCell = ({ client }) => {
  const clientId = client._id || client.suggestedClientId;
  const isRevealed = revealedPhones[clientId];
  const isLoading = phoneRevealLoading[clientId];
  
  console.log(`📱 PhoneNumberCell render for ${clientId}:`, { 
    isRevealed: !!isRevealed, 
    phoneNumber: isRevealed,
    isLoading,
    userRole,
    creditStatus,
    creditStatusCurrent: creditStatus?.current,
    hasCredits: creditStatus && creditStatus.current > 0,
    shouldShowNoCredits: userRole === 'CLOSER' && (!creditStatus || creditStatus.current <= 0)
  });

  // Show revealed phone number
  if (isRevealed) {
    console.log(`Showing revealed phone for ${clientId}: ${isRevealed}`);
    return (
      <div className="flex items-center space-x-2">
        <span className="text-gray-900 font-medium">{isRevealed}</span>
        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
          Revealed
        </span>
      </div>
    );
  }

  // Show reveal button
  return (
    <button
      onClick={() => handleRevealPhoneNumber(client)}
      disabled={isLoading || (userRole === 'CLOSER' && (!creditStatus || creditStatus.current <= 0))}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1 ${
        isLoading 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : userRole === 'CLOSER' && (!creditStatus || creditStatus.current <= 0)
          ? 'bg-red-100 text-red-600 cursor-not-allowed border border-red-300'
          : 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer border border-blue-300'
      }`}
      title={
        userRole === 'CLOSER' 
          ? (!creditStatus || creditStatus.current <= 0)
            ? 'No credits remaining - contact administrator'
            : `Click to reveal phone number (1 credit will be deducted)\nCurrent credits: ${creditStatus?.current || 0}`
          : 'Click to reveal phone number'
      }
    >
      {isLoading ? (
        <>
          <RefreshCw size={14} className="animate-spin" />
          <span>Revealing...</span>
        </>
      ) : userRole === 'CLOSER' && (!creditStatus || creditStatus.current <= 0) ? (
        <>
          <AlertCircle size={14} />
          <span>No Credits</span>
        </>
      ) : (
        <>
          <Eye size={14} />
          <span>Reveal Phone</span>
          {userRole === 'CLOSER' && creditStatus && (
            <span className="text-xs bg-blue-200 text-blue-800 px-1 rounded">
              -1
            </span>
          )}
        </>
      )}
    </button>
  );
};
  
  // Set date range filters
  useEffect(() => {
    const today = new Date();
    let startDate = null;
    
    if (dateRange === 'Last 30 days') {
      startDate = new Date();
      startDate.setDate(today.getDate() - 30);
    } else if (dateRange === 'Last 90 days') {
      startDate = new Date();
      startDate.setDate(today.getDate() - 90);
    } else if (dateRange === 'This month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (dateRange === 'Last month') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      setFilters(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }));
      return;
    } else if (dateRange === 'This year') {
      startDate = new Date(today.getFullYear(), 0, 1);
    } else if (dateRange === 'All time') {
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: ''
      }));
      return;
    }
    
    if (startDate) {
      setFilters(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }));
    }
  }, [dateRange]);
  
  // Fetch suggested clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const currentFilters = { ...filters };
      console.log('Fetching suggested clients with filters:', currentFilters);
  
      const currentLimit = limit || 25;
      
      const response = await SuggestedClientService.getAllSuggestedClients(page, currentLimit, currentFilters);
      console.log('Received suggested clients data:', response);
      
      if (response && response.data && response.data.clients) {
        const enrichedClients = response.data.clients.map(client => {
          return {
            ...client,
            creatorName: client.creatorName || usersMap[client.createdBy] || 'N/A',
            assignedToName: client.assignedToName || usersMap[client.assignedTo] || 'Unassigned',
            validatorName: client.validatorName || usersMap[client.validatedBy] || 'N/A'
          };
        });
        
        setClients(enrichedClients);
        console.log(`Updated clients array with ${enrichedClients.length} items`);
        
        // Set pagination data
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalItems(response.data.pagination.totalItems || 0);
          console.log('Updated pagination:', response.data.pagination);
        }
        
        // Set statistics data
        if (response.data.stats) {
          setStats(response.data.stats);
          console.log('Updated stats:', response.data.stats);
        }
        
        setError(null);
      } else {
        console.error('Invalid response format:', response);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      console.error('Error fetching suggested clients:', err);
      setError('Failed to fetch suggested clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Return all clients since filtering is now handled entirely on the backend
  const getFilteredClients = () => {
    return clients || [];
  };

  // Load users on mount
  // Replace the existing useEffect with:
useEffect(() => {
  console.log('🚀 Component mounted - initializing data...');
  fetchClients();
  fetchUsers();
  fetchUniqueBusinessTypes();
  fetchUniqueWilayas();
  
  // Load credit status for closers
  if (userRole === 'CLOSER' || userRole === 'closer') {
    fetchCreditStatus();
    fetchUserCallStats();
  }
}, [userRole]); // Only depend on userRole for initial load

  // Fetch clients whenever dependencies change
  useEffect(() => {
    console.log('📊 Filters changed - fetching clients...', filters);
    fetchClients();
  }, [page, limit, filters, activeTab]); // Add filters to dependencies
  
  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportMenuRef]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setOpenStatusDropdown(null);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setOpenPriorityDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusDropdownRef, priorityDropdownRef]);

  // Handle tab change
  const handleTabChange = (tab) => {
    console.log(`Tab changed to: ${tab}`);
    setActiveTab(tab);
    
    // Convert tab selection to backend filters
    setFilters(prev => {
      const newFilters = { ...prev };
      
      // Clear previous tab-based filters
      delete newFilters.status;
      delete newFilters.isValidated;
      delete newFilters.scoreMin;
      delete newFilters.callBackLater;
      
      // Apply new tab-based filters
      if (tab === 'Pending') {
        newFilters.status = 'pending';
      } else if (tab === 'Contacted') {
        newFilters.status = 'contacted';
      } else if (tab === 'Interested') {
        newFilters.status = 'interested';
      } else if (tab === 'Validated') {
        newFilters.isValidated = true;
      } else if (tab === 'Score > 0') {
        newFilters.scoreMin = 1; // Add this new filter for score > 0
      } else if (tab === 'Call Back Later') {
        newFilters.callBackLater = true; // Add this new filter for call back later
      }
      
      return newFilters;
    });
    
    // Reset to page 1 when changing tabs
    setPage(1);
  };

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    setPage(1);
  };

  const handleAddClient = () => {
    setCurrentClient(null);
    setIsAddClientOpen(true);
  };

  const handleEditClient = (client) => {
    setCurrentClient(client);
    setIsAddClientOpen(true);
  };

  const handleAddCallLog = (client) => {
    setCurrentClient(client);
    setIsCallLogOpen(true);
  };

  const handleValidateClient = (client) => {
    setCurrentClient(client);
    setIsValidationOpen(true);
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this suggested client?')) {
      try {
        await SuggestedClientService.deleteSuggestedClient(clientId);
        fetchClients();
      } catch (err) {
        setError(`Failed to delete suggested client: ${err.message}`);
      }
    }
  };

  const handleAddClientSuccess = () => {
    fetchClients();
  };

  const handleCallLogSuccess = () => {
    fetchClients();
    fetchUserCallStats(); // Refresh user call stats when a call is made
  };

  const handleValidationSuccess = () => {
    fetchClients();
  };
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    // Update filters to include search term for backend filtering
    setFilters(prev => ({
      ...prev,
      search: newSearchTerm
    }));
    
    // Reset to page 1 when searching
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-gray-100 text-gray-800', darkColor: 'bg-gray-800 text-gray-300' },
      'contacted': { color: 'bg-blue-100 text-blue-800', darkColor: 'bg-blue-900 text-blue-300' },
      'interested': { color: 'bg-green-100 text-green-800', darkColor: 'bg-green-900 text-green-300' },
      'not_interested': { color: 'bg-red-100 text-red-800', darkColor: 'bg-red-900 text-red-300' },
      'validated': { color: 'bg-emerald-100 text-emerald-800', darkColor: 'bg-emerald-900 text-emerald-300' },
      'converted': { color: 'bg-purple-100 text-purple-800', darkColor: 'bg-purple-900 text-purple-300' }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const colorClass = theme === 'dark' ? config.darkColor : config.color;

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'low': { color: 'bg-gray-100 text-gray-800', darkColor: 'bg-gray-800 text-gray-300' },
      'medium': { color: 'bg-yellow-100 text-yellow-800', darkColor: 'bg-yellow-900 text-yellow-300' },
      'high': { color: 'bg-orange-100 text-orange-800', darkColor: 'bg-orange-900 text-orange-300' },
      'urgent': { color: 'bg-red-100 text-red-800', darkColor: 'bg-red-900 text-red-300' }
    };

    const config = priorityConfig[priority] || priorityConfig['medium'];
    const colorClass = theme === 'dark' ? config.darkColor : config.color;

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      </span>
    );
  };

  // The StatCard component
  const StatCard = ({ title, value, percentChange, theme, icon }) => {
    const isPositive = percentChange >= 0;
    
    return (
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {icon}
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold">{value}</p>
          <p className={`ml-2 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <span>{isPositive ? '↑' : '↓'} {Math.abs(percentChange)}%</span>
          </p>
        </div>
      </div>
    );
  };

  // Date range options
  const dateRangeOptions = [
    'Last 30 days',
    'Last 90 days',
    'This month',
    'Last month',
    'This year',
    'All time'
  ];

  // Handler for page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const filteredClients = clients ? getFilteredClients() : [];

  console.log('🔍 Current render state:', {
    clientsCount: clients ? clients.length : 0,
    filteredCount: filteredClients.length,
    totalItems,
    totalPages,
    page,
    limit,
    filters,
    userRole,
    creditStatus,
    hasCredits: creditStatus && creditStatus.current > 0
  });
  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Add Client Popup */}
      <AddSuggestedClientPopup
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSuccess={handleAddClientSuccess}
        client={currentClient}
        theme={theme}
      />
      
      {/* Call Log Popup */}
      <CallLogPopup
        isOpen={isCallLogOpen}
        onClose={() => setIsCallLogOpen(false)}
        onSuccess={handleCallLogSuccess}
        client={currentClient}
        theme={theme}
      />

      {/* Validation Popup */}
      <ValidationPopup
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        onSuccess={handleValidationSuccess}
        client={currentClient}
        theme={theme}
      />

      {/* Excel Importer Component */}
      <SuggestedClientExcelImporter
        isOpen={isExcelImporterOpen}
        onClose={() => setIsExcelImporterOpen(false)}
        onSuccess={handleImportSuccess}
        theme={theme}
      />

      {/* NEW MODAL COMPONENTS */}
      <CallLogsModal />
      <NotesModal />
      <ClientDetailsModal />

      <DeleteAllConfirmationDialog />
      
      {/* Header section */}
      {userRole === 'CLOSER' && creditStatus && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg mb-4">
          <CreditCard size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Credits: {creditStatus.current}
          </span>
          {creditStatus.current <= 5 && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Low
            </span>
          )}
          <span className="text-xs text-blue-600">
            ✅ Connected
          </span>
        </div>
      )}
      <LowCreditWarning />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Suggested Clients</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteAllConfirmation(true)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            <Trash size={18} />
            Delete All
          </button>
          
          {/* Import Excel Button */}
          <button
            onClick={handleOpenExcelImporter}
            className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <Upload size={18} />
            Import Excel
          </button>
          
          <div className="relative" ref={exportMenuRef}>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={18} />
              Export
            </button>
            
            {showExportMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } ring-1 ring-black ring-opacity-5`}>
                    <div className="py-1">
                    <button
                        onClick={handleExportCSV}
                        className={`w-full text-left px-4 py-2 text-sm ${
                        theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        } flex items-center`}
                    >
                        <FileText size={16} className="mr-2" />
                        Export to CSV ({getFilteredClients().length} records)
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className={`w-full text-left px-4 py-2 text-sm ${
                        theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        } flex items-center`}
                    >
                        <FileSpreadsheet size={16} className="mr-2" />
                        Export to Excel ({getFilteredClients().length} records)
                    </button>
                    <div className={`border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} my-1`}></div>
                    <button
                        onClick={handleExportStats}
                        className={`w-full text-left px-4 py-2 text-sm ${
                        theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        } flex items-center`}
                    >
                        <DollarSign size={16} className="mr-2" />
                        Export Statistics Summary
                    </button>
                    </div>
                </div>
                )}
          </div>
          <button
            onClick={handleAddClient}
            className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlusCircle size={18} />
            Add Suggested Client
          </button>
        </div>
      </div>
      
      {/* Date Range and Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 bg-white text-gray-700">
            <Calendar size={18} />
            {dateRange}
          </button>
          <div className={`absolute left-0 mt-1 w-48 rounded-md shadow-lg z-10 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } ring-1 ring-black ring-opacity-5 hidden group-hover:block`}>
            <div className="py-1">
              {dateRangeOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleDateRangeChange(option)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    dateRange === option 
                      ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                      : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="Total Clients" 
          value={stats.totalClients} 
          percentChange={12.5} 
          theme={theme}
          icon={<Building2 size={20} />}
        />
        <StatCard 
          title="Interested Clients" 
          value={stats.interestedClients} 
          percentChange={18.7} 
          theme={theme}
          icon={<UserCheck size={20} />}
        />
        <StatCard 
          title="Validated Clients" 
          value={stats.validatedClients} 
          percentChange={-5.2} 
          theme={theme}
          icon={<Star size={20} />}
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${stats.conversionRate}%`}
          percentChange={23.4} 
          theme={theme}
          icon={<DollarSign size={20} />}
        />
        {/* User Call Stats Card */}
        <StatCard 
          title="My Calls Today" 
          value={loadingCallStats ? '...' : (userCallStats?.callsToday || 0)}
          percentChange={userCallStats?.callsYesterday ? 
            (((userCallStats.callsToday - userCallStats.callsYesterday) / Math.max(userCallStats.callsYesterday, 1)) * 100).toFixed(1) : 
            0
          }
          theme={theme}
          icon={<PhoneCall size={20} />}
        />
      </div>
      
      {/* User Call Stats Summary */}
      {userCallStats && (
        <div className={`mb-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PhoneCall size={20} className="text-blue-500" />
              {userCallStats.username}'s Call Statistics
            </h3>
            <button 
              onClick={fetchUserCallStats}
              className={`p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Refresh call stats"
            >
              <RefreshCw size={16} className={loadingCallStats ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userCallStats.callsToday}</div>
              <div className="text-sm text-gray-500">Calls Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userCallStats.callsYesterday}</div>
              <div className="text-sm text-gray-500">Calls Yesterday</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userCallStats.totalCalls}</div>
              <div className="text-sm text-gray-500">Total Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{userCallStats.dailyAverage}</div>
              <div className="text-sm text-gray-500">Daily Average</div>
            </div>
          </div>
          {userCallStats.lastCallDate && (
            <div className="mt-2 text-sm text-gray-500">
              Last call: {formatDate(userCallStats.lastCallDate)}
            </div>
          )}
        </div>
      )}
      
      {/* Tab Filters */}
      <div className="flex mb-4 border-b border-gray-200">
                        {['All', 'Pending', 'Contacted', 'Interested', 'Validated', 'Score > 0', 'Call Back Later'].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab 
                ? `border-b-2 border-blue-500 text-blue-600` 
                : `text-gray-500 hover:text-gray-700`
            }`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Score Range Filter */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-yellow-500" />
          <span className="font-medium text-gray-700">Filter by Score:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, scoreRange: '' }))}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              !filters.scoreRange 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Scores
          </button>
          {scoreRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilters(prev => ({ ...prev, scoreRange: option.value }))}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                filters.scoreRange === option.value
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
              <span className="bg-yellow-500 text-yellow-900 px-1 rounded text-xs">
                {option.credits}💳
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Business Type Filter */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Briefcase size={18} className="text-green-600" />
          <span className="font-medium text-gray-700">Filter by Business Type:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              console.log('🏢 Business type filter cleared (All Types clicked)');
              setFilters(prev => ({ ...prev, businessType: '' }));
              setPage(1); // Reset to page 1 when clearing filter
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              !filters.businessType 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Types
          </button>
          {uniqueBusinessTypes.map(type => (
            <button
              key={type}
              onClick={() => {
                console.log('🏢 Business type filter clicked:', type);
                setFilters(prev => ({ ...prev, businessType: type }));
                setPage(1); // Reset to page 1 when filtering
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filters.businessType === type
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Wilaya Filter */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-purple-600" />
          <span className="font-medium text-gray-700">Filter by Wilaya:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              console.log('🗺️ Wilaya filter cleared (All Wilayas clicked)');
              setFilters(prev => ({ ...prev, wilaya: '' }));
              setPage(1); // Reset to page 1 when clearing filter
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              !filters.wilaya 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Wilayas
          </button>
          {uniqueWilayas.map(wilaya => (
            <button
              key={wilaya}
              onClick={() => {
                console.log('🗺️ Wilaya filter clicked:', wilaya);
                setFilters(prev => ({ ...prev, wilaya: wilaya }));
                setPage(1); // Reset to page 1 when filtering
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filters.wilaya === wilaya
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {wilaya}
            </button>
          ))}
        </div>
      </div>
      
      {/* Search and Refresh */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search suggested clients..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
            }`}
          />
        </div>
        <button
          onClick={() => {
            console.log('Refreshing with explicit params:', { page, limit, filters });
            fetchClients();
          }}
          className={`p-2 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
          }`}
          title="Refresh suggested clients list"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {error && (
        <div className={`mb-4 p-3 rounded ${
          theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
        }`}>
          {error}
        </div>
      )}
      
      {/* Total count display */}
      <div className="mb-4 text-sm">
        <span className="font-semibold">Total Records:</span> {totalItems} | 
        <span className="font-semibold ml-2">Showing:</span> {clients ? clients.length : 0} of {totalItems}
        {filters.search && <span className="ml-2 italic">(filtered by search)</span>}
        {activeTab !== 'All' && <span className="ml-2 italic">(filtered by {activeTab})</span>}
        {filters.scoreRange && <span className="ml-2 italic">(filtered by score)</span>}
        {filters.businessType && <span className="ml-2 italic">(filtered by business type: {filters.businessType})</span>}
        {filters.wilaya && <span className="ml-2 italic">(filtered by wilaya: {filters.wilaya})</span>}
        {filters.callBackLater && <span className="ml-2 italic">(filtered by call back later)</span>}
      </div>
      
      {/* Suggested Clients Table */}
      <div className={`overflow-hidden rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Client ID</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Store Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Business Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created By</th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client._id || client.suggestedClientId}>
                    <td className="px-6 py-4 whitespace-nowrap">{client.suggestedClientId}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{client.storeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1 text-gray-400" />
                        {client.wilaya}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Briefcase size={14} className="mr-1 text-gray-400" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {client.businessType || 'Other'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PhoneNumberCell client={client} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="mr-1 text-yellow-500" />
                        <div className="flex flex-col">
                          <span className={`font-medium text-sm ${
                            (client.score || 0) > 0 
                              ? (theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700')
                              : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                          }`}>
                            {client.score || 0}
                          </span>
                          <span className={`text-xs px-1 rounded ${
                            (client.score || 0) < 100 
                              ? 'bg-gray-100 text-gray-600' 
                              : (client.score || 0) >= 100 && (client.score || 0) <= 400
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {(client.score || 0) < 100 
                              ? '1💳' 
                              : (client.score || 0) >= 100 && (client.score || 0) <= 400
                              ? '2💳'
                              : '3💳'
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative" ref={openStatusDropdown === client._id ? statusDropdownRef : null}>
                        <button
                          onClick={() => {
                            if (client.status === 'pending' || client.status === 'contacted') {
                              setOpenStatusDropdown(openStatusDropdown === client._id ? null : client._id);
                            }
                          }}
                          className={`${getStatusBadge(client.status).props.className} flex items-center ${
                            (client.status === 'pending' || client.status === 'contacted') ? 'cursor-pointer' : 'cursor-default'
                          }`}
                        >
                          {client.status}
                          {(client.status === 'pending' || client.status === 'contacted') && (
                            <ChevronDown size={14} className="ml-1" />
                          )}
                        </button>

                        {openStatusDropdown === client._id && (client.status === 'pending' || client.status === 'contacted') && (
                          <div className={`absolute left-0 mt-1 w-36 rounded-md shadow-lg z-20 ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                          } ring-1 ring-black ring-opacity-5`}>
                            <div className="py-1">
                              {statusOptions.filter(option => 
                                option.value !== client.status && 
                                (option.value === 'contacted' || option.value === 'interested' || option.value === 'not_interested')
                              ).map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => handleStatusUpdate(client._id || client.suggestedClientId, option.value)}
                                  className={`w-full text-left px-3 py-2 text-sm flex items-center ${
                                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <span 
                                    className={`w-2 h-2 rounded-full mr-2 ${
                                      option.color === 'green' ? 'bg-green-500' :
                                      option.color === 'red' ? 'bg-red-500' :
                                      option.color === 'blue' ? 'bg-blue-500' :
                                      'bg-gray-500'
                                    }`} 
                                  />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative" ref={openPriorityDropdown === client._id ? priorityDropdownRef : null}>
                        <button
                          onClick={() => {
                            setOpenPriorityDropdown(openPriorityDropdown === client._id ? null : client._id);
                          }}
                          className={`${getPriorityBadge(client.priority).props.className} flex items-center cursor-pointer`}
                        >
                          {client.priority}
                          <ChevronDown size={14} className="ml-1" />
                        </button>

                        {openPriorityDropdown === client._id && (
                          <div className={`absolute left-0 mt-1 w-32 rounded-md shadow-lg z-20 ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                          } ring-1 ring-black ring-opacity-5`}>
                            <div className="py-1">
                              {priorityOptions.filter(option => option.value !== client.priority).map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => handlePriorityUpdate(client._id || client.suggestedClientId, option.value)}
                                  className={`w-full text-left px-3 py-2 text-sm flex items-center ${
                                    theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <span 
                                    className={`w-2 h-2 rounded-full mr-2 ${
                                      option.color === 'red' ? 'bg-red-500' :
                                      option.color === 'orange' ? 'bg-orange-500' :
                                      option.color === 'yellow' ? 'bg-yellow-500' :
                                      'bg-gray-500'
                                    }`} 
                                  />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        client.totalCalls > 0 
                          ? (theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
                      }`}>
                        {client.totalCalls || 0} calls
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">{client.creatorName}</td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs">{client.assignedToName || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(client.createdAt)}</td>
                    
                    {/* ENHANCED ACTIONS COLUMN */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Call Logs Icon */}
                        <button 
                          onClick={() => handleViewCallLogs(client)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} relative group`}
                          title="View call logs"
                        >
                          <History size={18} className="text-purple-500" />
                          {client.totalCalls > 0 && (
                            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                              {client.totalCalls}
                            </span>
                          )}
                        </button>

                        {/* View Validation Notes Icon */}
                        {(client.isValidated || client.validationNotes) && (
                          <button 
                            onClick={() => handleViewNotes(client)}
                            className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} relative group`}
                            title="View validation notes"
                          >
                            <FileCheck size={18} className={client.isValidated ? "text-green-500" : "text-yellow-500"} />
                            {client.validationNotes && (
                              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3 w-3"></span>
                            )}
                          </button>
                        )}

                        {/* Client Details/Summary Icon */}
                        <button 
                          onClick={() => handleViewClientDetails(client)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="View client details"
                        >
                          <Eye size={18} className="text-blue-500" />
                        </button>

                        {/* Add Call Log */}
                        <button 
                          onClick={() => handleAddCallLog(client)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Add call log"
                        >
                          <PhoneCall size={18} className="text-blue-500" />
                        </button>

                        {/* Validate Client */}
                        <button 
                          onClick={() => handleValidateClient(client)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Validate client"
                        >
                          {client.isValidated ? (
                            <UserCheck size={18} className="text-green-500" />
                          ) : (
                            <UserX size={18} className="text-gray-500" />
                          )}
                        </button>

                        {/* Edit Client */}
                        <button 
                          onClick={() => handleEditClient(client)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Edit client"
                        >
                          <Pencil size={18} className="text-blue-500" />
                        </button>

                        {/* Delete Client */}
                        <button 
                          onClick={() => handleDelete(client._id)}
                          className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Delete client"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="px-6 py-10 text-center">
                    No suggested clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredClients.length > 0 && (
          <div className={`px-6 py-3 flex justify-between items-center border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="text-sm">
              Showing {Math.min((page - 1) * limit + 1, totalItems)} to {Math.min(page * limit, totalItems)} of {totalItems} suggested clients
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`p-1 rounded ${
                  page === 1
                    ? (theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400') 
                    : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              
              {/* Page number display */}
              <div className="flex items-center space-x-1">
                {page > 2 && (
                  <button
                    onClick={() => handlePageChange(1)}
                    className={`px-3 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    1
                  </button>
                )}
                
                {page > 3 && (
                  <span className="text-gray-500">...</span>
                )}
                
                {page > 1 && (
                  <button onClick={() => handlePageChange(page - 1)}
                  className={`px-3 py-1 rounded ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page - 1}
                </button>
                )}
                
                <button
                  className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}
                >
                  {page}
                </button>
                
                {page < totalPages && (
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    className={`px-3 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page + 1}
                  </button>
                )}
                
                {page < totalPages - 2 && (
                  <span className="text-gray-500">...</span>
                )}
                
                {page < totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className={`p-1 rounded ${
                  page >= totalPages
                    ? (theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                    : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedClientsManagement;