import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const salaryService = {
  // Get all employees with their salary data
  async getEmployees() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/users/employees`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Get current user's salary data
  async getCurrentUserSalary() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/current-user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching current user salary:', error);
      throw error;
    }
  },

  // Get employee salary details
  async getEmployeeSalary(employeeId, month) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/salary/${employeeId}`, {
        params: { month },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching employee salary:', error);
      throw error;
    }
  },

  // Get daily reports for an employee
  async getDailyReports(employeeId, month) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/daily-reports/${employeeId}`, {
        params: { month },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      throw error;
    }
  },

  // Get check-in data for an employee
  async getCheckins(employeeId, month) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/checkins/${employeeId}`, {
        params: { month },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      throw error;
    }
  },

  // Calculate salary for an employee
  async calculateSalary(employeeId, month) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/salary/calculate`, {
        employeeId,
        month
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating salary:', error);
      throw error;
    }
  }
};

export default salaryService; 