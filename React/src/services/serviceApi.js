import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const serviceApi = {
  // Get service statistics
  getServiceStats: async () => {
    try {
      const response = await axiosInstance.get('/services/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching service stats:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get all services with filtering and pagination
  getServices: async (params) => {
    try {
      const response = await axiosInstance.get('/services', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error.response?.data || error.message;
    }
  },

  // Create a new service
  createService: async (serviceData) => {
    try {
      const response = await axiosInstance.post('/services', serviceData);
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get a single service
  getService: async (id) => {
    try {
      const response = await axiosInstance.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update a service
  updateService: async (id, serviceData) => {
    try {
      const response = await axiosInstance.put(`/services/${id}`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error.response?.data || error.message;
    }
  },

  // Delete a service
  deleteService: async (id) => {
    try {
      const response = await axiosInstance.delete(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error.response?.data || error.message;
    }
  },

  // Assign users to a service
  assignUsers: async (id, userIds) => {
    try {
      const response = await axiosInstance.post(`/services/${id}/assign`, { userIds });
      return response.data;
    } catch (error) {
      console.error('Error assigning users:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update service status
  updateServiceStatus: async (serviceId, newStatus, comment = '') => {
    try {
      const response = await axiosInstance.patch(`/services/${serviceId}/status`, {
        status: newStatus,
        comment
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update service status');
    }
  },

  /**
   * Get status history for a service
   * @param {string} serviceId - The ID of the service
   * @returns {Promise<Array>} Array of status history entries
   * @throws {Error} If fetching status history fails
   */
  getServiceStatusHistory: async (serviceId) => {
    try {
      const response = await axiosInstance.get(`/services/${serviceId}/status-history`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch service status history');
    }
  }
};

export default serviceApi; 