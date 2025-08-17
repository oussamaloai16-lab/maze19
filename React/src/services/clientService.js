import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseUrl}/api/clients`;

// Add auth token to all requests
const authAxios = axios.create();
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class ClientService {
  // Create a new client (public endpoint - no auth required)
  async createClient(clientData) {
    try {
      const response = await axios.post(API_URL, clientData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Client creation error:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to create client';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to create client';
      }
    }
  }

  // Get all clients with pagination and filtering
  async getAllClients(page = 1, limit = 10, filters = {}) {
    try {
      const config = {
        params: {
          page,
          limit,
          ...filters
        }
      };
      
      const response = await authAxios.get(API_URL, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch clients';
    }
  }

  // Get client by ID
  async getClientById(clientId) {
    try {
      const response = await authAxios.get(`${API_URL}/${clientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch client';
    }
  }

  // Update client
  async updateClient(clientId, updateData) {
    try {
      const response = await authAxios.put(`${API_URL}/${clientId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update client';
    }
  }

  // Update client status
  async updateClientStatus(clientId, status, notes) {
    try {
      const response = await authAxios.patch(`${API_URL}/${clientId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update client status';
    }
  }

  // Delete client
  async deleteClient(clientId) {
    try {
      const response = await authAxios.delete(`${API_URL}/${clientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to delete client';
    }
  }

  // Get client statistics
  async getClientStats() {
    try {
      const response = await authAxios.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch client statistics';
    }
  }

  // Utility functions
  getStatusColor(status) {
    const statusColors = {
      'new': 'blue',
      'contacted': 'yellow',
      'in-progress': 'orange',
      'completed': 'green',
      'cancelled': 'red'
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
}

export default new ClientService(); 