import axios from 'axios';
const baseUrl = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseUrl}/orders`;

class OrderService {
  async createOrder(orderData) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      // If there's no tracking ID, the backend will generate one
      // No need to add additional fields here as the backend handles ZRexpress integration
      const response = await axios.post(API_URL, orderData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to create order';
    }
  }

  // Add this to your orderService.js
  async syncOrderWithZRexpress(orderId) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      const response = await axios.post(`${API_URL}/${orderId}/sync-zrexpress`, {}, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to sync order with ZRexpress';
    }
  }

  // New method for confirming orders
  async confirmOrder(orderId) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      const response = await axios.post(`${API_URL}/${orderId}/confirm`, {}, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to confirm order';
    }
  }

  async getClientOrders(page = 1, limit = 10, status = null, startDate = null, endDate = null) {
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
      
      // Add status filter if provided
      if (status) {
        config.params.status = status;
      }
      
      // Add date range if provided
      if (startDate) {
        config.params.startDate = startDate;
      }
      if (endDate) {
        config.params.endDate = endDate;
      }
      
      const response = await axios.get(`${API_URL}/my-orders`, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch orders';
    }
  }

  async getAllOrders(page = 1, limit = 10, status = null, startDate = null, endDate = null) {
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
      // Add status filter if provided
      if (status) {
        config.params.status = status;
      }
      // Add date range if provided
      if (startDate) {
        config.params.startDate = startDate;
      }
      if (endDate) {
        config.params.endDate = endDate;
      }
      const response = await axios.get(`${API_URL}/all`, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch all orders';
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      const response = await axios.patch(`${API_URL}/${orderId}/status`, { status }, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update order status';
    }
  }

  async logConfirmationAttempt(orderId, attemptData) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      const response = await axios.post(`${API_URL}/${orderId}/confirmation-attempt`, attemptData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to log confirmation attempt';
    }
  }
}

export default new OrderService();