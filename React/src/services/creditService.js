// Enhanced services/creditService.js
import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseUrl}/credits`;

class CreditService {
  // Get current user's credit status
  async getCreditStatus() {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/status`, config);
      return response.data;
    } catch (error) {
      console.error('Credit status fetch error:', error);
      throw error.response?.data?.message || 'Failed to fetch credit status';
    }
  }

  // Reveal phone number (deducts credit for closers)
  async revealPhoneNumber(clientId) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log(`Attempting to reveal phone number for client: ${clientId}`);
      const response = await axios.post(`${API_URL}/reveal-phone/${clientId}`, {}, config);
      console.log('Phone number reveal response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Phone number reveal error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        // Insufficient credits or other validation errors
        throw error.response.data.message || 'Cannot reveal phone number';
      } else if (error.response?.status === 403) {
        // Permission denied
        throw 'Access denied. Only closers can use this feature.';
      } else if (error.response?.status === 404) {
        // Client not found
        throw 'Client not found';
      } else {
        // Generic error
        throw error.response?.data?.message || 'Failed to reveal phone number';
      }
    }
  }

  // Get credit history for current user
  async getCreditHistory(page = 1, limit = 10) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { page, limit }
      };
      
      const response = await axios.get(`${API_URL}/history`, config);
      return response.data;
    } catch (error) {
      console.error('Credit history fetch error:', error);
      throw error.response?.data?.message || 'Failed to fetch credit history';
    }
  }

  // Get credit history for specific user (admin only)
  async getUserCreditHistory(userId, page = 1, limit = 10) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { page, limit }
      };
      
      const response = await axios.get(`${API_URL}/history/${userId}`, config);
      return response.data;
    } catch (error) {
      console.error('User credit history fetch error:', error);
      throw error.response?.data?.message || 'Failed to fetch user credit history';
    }
  }

  // Admin: Add credits to a closer
  async addCredits(userId, amount, reason) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Validate input on frontend too
      if (!userId) {
        throw 'User ID is required';
      }
      
      if (!amount || amount <= 0 || amount > 10000) {
        throw 'Amount must be between 1 and 10,000 credits';
      }
      
      const data = { 
        userId, 
        amount: parseInt(amount), 
        reason: reason || 'Manual credit addition by administrator'
      };
      
      console.log('Adding credits:', data);
      const response = await axios.post(`${API_URL}/add`, data, config);
      console.log('Add credits response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Add credits error:', error);
      
      if (typeof error === 'string') {
        throw error; // Frontend validation error
      }
      
      if (error.response?.status === 403) {
        throw 'Access denied. Only administrators can add credits.';
      } else if (error.response?.status === 400) {
        throw error.response.data.message || 'Invalid request';
      } else if (error.response?.status === 404) {
        throw 'User not found';
      } else {
        throw error.response?.data?.message || 'Failed to add credits';
      }
    }
  }

  // Admin: Get all closers with credit status
  async getAllClosersCredits() {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/all-closers`, config);
      return response.data;
    } catch (error) {
      console.error('Get all closers credits error:', error);
      
      if (error.response?.status === 403) {
        throw 'Access denied. Only administrators can view all credit information.';
      } else {
        throw error.response?.data?.message || 'Failed to fetch closers credit information';
      }
    }
  }

  // Admin: Initialize credits for all closers
  async initializeCredits(initialAmount = 100) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      // Validate amount
      if (initialAmount <= 0 || initialAmount > 1000) {
        throw 'Initial amount must be between 1 and 1000 credits';
      }
      
      const data = { initialAmount: parseInt(initialAmount) };
      
      console.log('Initializing credits with amount:', initialAmount);
      const response = await axios.post(`${API_URL}/initialize`, data, config);
      console.log('Initialize credits response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Initialize credits error:', error);
      
      if (typeof error === 'string') {
        throw error; // Frontend validation error
      }
      
      if (error.response?.status === 403) {
        throw 'Access denied. Only super administrators can initialize credits.';
      } else {
        throw error.response?.data?.message || 'Failed to initialize credits';
      }
    }
  }

  // Utility: Check if user has sufficient credits
  hasSufficientCredits(creditStatus, requiredAmount = 1) {
    if (!creditStatus) return false;
    return creditStatus.current >= requiredAmount;
  }

  // Utility: Get credit status color for UI
  getCreditStatusColor(current) {
    if (current > 50) return 'green';
    if (current > 20) return 'yellow';
    if (current > 0) return 'orange';
    return 'red';
  }

  // Utility: Get credit status message
  getCreditStatusMessage(current) {
    if (current === 0) return 'No credits remaining';
    if (current <= 5) return 'Very low credits';
    if (current <= 20) return 'Low credits';
    if (current <= 50) return 'Moderate credits';
    return 'Good credit balance';
  }

  // Utility: Format credit history entry
  formatHistoryEntry(entry) {
    const date = new Date(entry.date).toLocaleString();
    const type = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
    const amount = entry.type === 'deduction' ? `-${entry.amount}` : `+${entry.amount}`;
    
    return {
      ...entry,
      formattedDate: date,
      formattedType: type,
      formattedAmount: amount,
      color: entry.type === 'deduction' ? 'red' : 'green'
    };
  }

  // Utility: Calculate credit usage percentage
  calculateUsagePercentage(current, total) {
    if (!total || total === 0) return 0;
    return Math.round(((total - current) / total) * 100);
  }

  // Debug: Get current user role from token
  getCurrentUserRole() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  // Debug: Check if current user is closer
  isCurrentUserCloser() {
    return this.getCurrentUserRole() === 'CLOSER';
  }

  // Debug: Check if current user is admin
  isCurrentUserAdmin() {
    const role = this.getCurrentUserRole();
    return role === 'SUPER_ADMIN' || role === 'CHEF_DE_BUREAU';
  }
}

export default new CreditService();