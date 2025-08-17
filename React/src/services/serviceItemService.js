import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseUrl}/service-items`;

class ServiceItemService {
  async getAllServiceItems() {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const response = await axios.get(API_URL, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch service items';
    }
  }

  // Add other methods for CRUD operations as needed
}

export default new ServiceItemService(); 