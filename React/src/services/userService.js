import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;


const API_URL = `${baseUrl}/users`;
const BASE_URL = baseUrl;

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

// Get users by role function
export const getUsersByRole = async (role) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/role/${role}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch users by role' };
  }
};

class UserService {

  
  // Get all users
  async getAllUsers() {
    const response = await authAxios.get(API_URL);
    return response.data;
  }
  
  // Get single user
  async getUser(id) {
    const response = await authAxios.get(`${API_URL}/${id}`);
    return response.data;
  }
  
  // Create user
  async createUser(userData) {
    const response = await authAxios.post(API_URL, userData);
    return response.data;
  }
  
  // Update user
  async updateUser(id, userData) {
    const response = await authAxios.put(`${API_URL}/${id}`, userData);
    return response.data;
  }
  
  // Deactivate user
  async deactivateUser(id) {
    try {
      console.log(`Deactivating user with ID: ${id}`);
      
      const response = await authAxios.delete(`${API_URL}/${id}`);
      console.log('Deactivation response:', response);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Unknown error during deactivation');
      }
    } catch (error) {
      console.error('Deactivation error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Extract error message from response if available
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || `Request failed with status ${error.response.status}`);
      }
      
      throw error; // Re-throw original error if no response data
    }
  }

  
  // Get current user profile
  async getProfile() {
    const response = await authAxios.get(`${API_URL}/profile`);
    return response.data;
  }
  
  // Update user role
  async updateRole(id, roleData) {
    const response = await authAxios.put(`${API_URL}/${id}/role`, roleData);
    return response.data;
  }
  
  // Update password
  async updatePassword(id, passwordData) {
    const response = await authAxios.put(`${API_URL}/${id}/password`, passwordData);
    return response.data;
  }

  async uploadAvatar(file) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Special config for file upload
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const response = await authAxios.post(`${API_URL}/avatar`, formData, config);
      
      // Process the avatar URL in the response
      if (response.data.success) {
        // Handle different response formats
        if (response.data.data.user && response.data.data.user.avatar) {
          response.data.data.user.avatar = this.getFullAvatarUrl(response.data.data.user.avatar);
        }
        
        if (response.data.data.avatarUrl) {
          response.data.data.avatarUrl = this.getFullAvatarUrl(response.data.data.avatarUrl);
        }
      }

      console.log('Processed avatar response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Avatar upload error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Extract error message from response if available
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || `Upload failed with status ${error.response.status}`);
      }
      throw error; // Re-throw original error if no response data
    }
  }

  // Helper method to ensure avatar URLs are complete
  getFullAvatarUrl(avatarPath) {
    if (!avatarPath) return null;
    
    // If already a full URL, return as is
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    
    // Strip any leading slash for consistency
    const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
    
    // Always use the complete URL
    return `${BASE_URL}/${cleanPath}`;
  }

  // Get current user's call statistics
  async getCallStats() {
    try {
      const response = await authAxios.get(`${API_URL}/call-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching call stats:', error);
      throw error.response?.data || { message: 'Failed to fetch call statistics' };
    }
  }
}

export default new UserService();