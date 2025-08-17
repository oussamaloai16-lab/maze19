// services/suggestedClientService.js
import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseUrl}/suggested-clients`;

// Helper function to format phone numbers
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove any non-digit characters and format consistently
  return phone.toString().replace(/\D/g, '');
};

class SuggestedClientService {
  async createSuggestedClient(clientData) {
    try {
      const token = localStorage.getItem('token');
      
      // Ensure proper data formatting
      const formattedData = {
        ...clientData,
        phoneNumber: formatPhoneNumber(clientData.phoneNumber),
        estimatedBudget: clientData.estimatedBudget ? parseFloat(clientData.estimatedBudget) : null
      };
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log('Sending suggested client data:', formattedData);
      const response = await axios.post(API_URL, formattedData, config);
      console.log('Suggested client created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Suggested client creation error:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw error.response.data.message || 'Failed to create suggested client';
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw 'Network error - no response from server';
      } else {
        console.error('Request setup error:', error.message);
        throw error.message || 'Failed to create suggested client';
      }
    }
  }

  // Add this method to your SuggestedClientService
    async importSuggestedClients(clients) {
        try {
        const response = await fetch('/api/suggested-clients/import', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clients })
        });
        
        if (!response.ok) {
            throw new Error('Import failed');
        }
        
        return await response.json();
        } catch (error) {
        throw new Error(`Failed to import suggested clients: ${error.message}`);
        }
    }

  async getAllSuggestedClients(page = 1, limit = 25, filters = {}) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page,
          limit
        }
      };
      
      // Add filters if provided
      if (filters.status) config.params.status = filters.status;
      if (filters.wilaya) config.params.wilaya = filters.wilaya;
      if (filters.priority) config.params.priority = filters.priority;
      if (filters.assignedTo) config.params.assignedTo = filters.assignedTo;
      if (filters.createdBy) config.params.createdBy = filters.createdBy;
      if (filters.search) config.params.search = filters.search;
      if (filters.startDate) config.params.startDate = filters.startDate;
      if (filters.endDate) config.params.endDate = filters.endDate;
      if (filters.leadCollectionsMode) config.params.leadCollectionsMode = filters.leadCollectionsMode;
      if (filters.businessType) config.params.businessType = filters.businessType;
      if (filters.scoreRange) config.params.scoreRange = filters.scoreRange;
      if (filters.isValidated !== undefined) config.params.isValidated = filters.isValidated;
      if (filters.scoreMin !== undefined) config.params.scoreMin = filters.scoreMin;
      if (filters.callBackLater !== undefined) config.params.callBackLater = filters.callBackLater;
      
      console.log('Fetching suggested clients with params:', config.params);
      
      const response = await axios.get(`${API_URL}/all`, config);
      console.log('Suggested clients API response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('API error details:', error.response || error);
      throw error.response?.data?.message || 'Failed to fetch suggested clients';
    }
  }

  async getSuggestedClientById(clientId) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/${clientId}`, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch suggested client';
    }
  }

  async updateSuggestedClient(clientId, updateData) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Format data if needed
      if (updateData.phoneNumber) {
        updateData.phoneNumber = formatPhoneNumber(updateData.phoneNumber);
      }
      if (updateData.estimatedBudget) {
        updateData.estimatedBudget = parseFloat(updateData.estimatedBudget);
      }
      
      const response = await axios.patch(`${API_URL}/${clientId}`, updateData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update suggested client';
    }
  }

  async deleteSuggestedClient(clientId) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(`${API_URL}/${clientId}`, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to delete suggested client';
    }
  }

  async addCallLog(clientId, callLogData) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/${clientId}/call-logs`, callLogData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to add call log';
    }
  }

  async getCallLogs(clientId, page = 1, limit = 10) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { page, limit }
      };
      
      const response = await axios.get(`${API_URL}/${clientId}/call-logs`, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch call logs';
    }
  }

  async validateClient(clientId, isValid, notes) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const data = { isValid, notes };
      const response = await axios.patch(`${API_URL}/${clientId}/validate`, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to validate client';
    }
  }

  async assignClient(clientId, assignedTo) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const data = { assignedTo };
      const response = await axios.patch(`${API_URL}/${clientId}/assign`, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to assign client';
    }
  }

  async importSuggestedClients(clients) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Format clients data to ensure proper values
      const formattedClients = clients.map(client => ({
        ...client,
        phoneNumber: formatPhoneNumber(client.phoneNumber),
        estimatedBudget: client.estimatedBudget ? parseFloat(client.estimatedBudget) : null
      }));
      
      console.log('Sending import data:', { clients: formattedClients });
      
      const response = await axios.post(`${API_URL}/import`, { clients: formattedClients }, config);
      console.log('Suggested clients imported successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Suggested client import error:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw error.response.data.message || 'Failed to import suggested clients';
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw 'Network error - no response from server';
      } else {
        console.error('Request setup error:', error.message);
        throw error.message || 'Failed to import suggested clients';
      }
    }
  }

  async deleteAllSuggestedClients() {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const data = {
        confirmationToken: 'DELETE_ALL_SUGGESTED_CLIENTS_CONFIRM'
      };
      
      const response = await axios.delete(`${API_URL}/delete-all`, {
        ...config,
        data
      });
      
      console.log('All suggested clients deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to delete all suggested clients:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to delete all suggested clients';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to delete all suggested clients';
      }
    }
  }

  async getStatistics(startDate, endDate) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {}
      };
      
      if (startDate) {
        config.params.startDate = startDate;
      }
      
      if (endDate) {
        config.params.endDate = endDate;
      }
      
      const response = await axios.get(`${API_URL}/statistics`, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch suggested client statistics';
    }
  }

  // Utility functions
  formatPhoneNumber(phoneNumber) {
    return formatPhoneNumber(phoneNumber);
  }

  formatDisplayPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
      return 'N/A';
    }
    
    // Convert to string and clean the number
    const cleanNumber = phoneNumber.toString().replace(/[^\d]/g, '');
    
    // If it's empty after cleaning, return N/A
    if (!cleanNumber) {
      return 'N/A';
    }
    
    // Algerian phone number formatting
    if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // Format: 0XXX XX XX XX
      return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4, 6)} ${cleanNumber.slice(6, 8)} ${cleanNumber.slice(8, 10)}`;
    } else if (cleanNumber.length === 9 && !cleanNumber.startsWith('0')) {
      // Add leading 0 and format
      const withZero = '0' + cleanNumber;
      return `${withZero.slice(0, 4)} ${withZero.slice(4, 6)} ${withZero.slice(6, 8)} ${withZero.slice(8, 10)}`;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('213')) {
      // International format: +213 XXX XX XX XX
      const localNumber = cleanNumber.slice(3);
      if (localNumber.startsWith('0')) {
        return `+213 ${localNumber.slice(1, 4)} ${localNumber.slice(4, 6)} ${localNumber.slice(6, 8)} ${localNumber.slice(8, 10)}`;
      } else {
        return `+213 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5, 7)} ${localNumber.slice(7, 9)}`;
      }
    } else {
      // Return as-is if format is unrecognized but add spaces for readability
      if (cleanNumber.length >= 8) {
        const groups = cleanNumber.match(/.{1,2}/g);
        return groups.join(' ');
      }
      return cleanNumber;
    }
  }


  getStatusColor(status) {
    const statusColors = {
      'pending': 'gray',
      'contacted': 'blue',
      'interested': 'green',
      'not_interested': 'red',
      'validated': 'emerald',
      'converted': 'purple'
    };
    
    return statusColors[status] || 'gray';
  }

  getPriorityColor(priority) {
    const priorityColors = {
      'low': 'gray',
      'medium': 'yellow',
      'high': 'orange',
      'urgent': 'red'
    };
    
    return priorityColors[priority] || 'gray';
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  }

  formatDetailedDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting detailed date:', e);
      return 'Invalid Date';
    }
  }

  getCallOutcomeColor(outcome) {
    const colors = {
      'interested': 'green',
      'not_interested': 'red',
      'call_back_later': 'yellow',
      'no_answer': 'gray',
      'invalid_number': 'red'
    };
    
    return colors[outcome] || 'gray';
  }

  getCallOutcomeText(outcome) {
    const texts = {
      'interested': 'Interested',
      'not_interested': 'Not Interested',
      'call_back_later': 'Call Back Later',
      'no_answer': 'No Answer',
      'invalid_number': 'Invalid Number'
    };
    
    return texts[outcome] || outcome;
  }

  async getUniqueBusinessTypes() {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/business-types`, config);
      console.log('Business types fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Business types fetch error:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw error.response.data.message || 'Failed to fetch business types';
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw 'Network error - no response from server';
      } else {
        console.error('Request setup error:', error.message);
        throw error.message || 'Failed to fetch business types';
      }
    }
  }

  async getUniqueWilayas() {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/wilayas`, config);
      console.log('Wilayas fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Wilayas fetch error:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw error.response.data.message || 'Failed to fetch wilayas';
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw 'Network error - no response from server';
      } else {
        console.error('Request setup error:', error.message);
        throw error.message || 'Failed to fetch wilayas';
      }
    }
  }
}

export default new SuggestedClientService();