// services/dailyReportService.js
import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseUrl}/daily-reports`;

// Create axios instance with auth interceptor
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

class DailyReportService {
  // Submit or update employee daily report
  async submitEmployeeReport(content, summary = '') {
    try {
      const response = await authAxios.post(`${API_URL}/employee/submit`, {
        content,
        summary
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit daily report' };
    }
  }

  // Get current user's report for today
  async getMyTodayReport() {
    try {
      const response = await authAxios.get(`${API_URL}/employee/my-today`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch today\'s report' };
    }
  }

  // Get all employee daily reports (admin only)
  async getAllEmployeeReports(filters = {}) {
    try {
      const { date, employeeId, page = 1, limit = 10 } = filters;
      
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (employeeId) params.append('employeeId', employeeId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await authAxios.get(`${API_URL}/employee/all?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employee reports' };
    }
  }

  // Get specific report by ID
  async getReportById(reportId) {
    try {
      const response = await authAxios.get(`${API_URL}/${reportId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch report details' };
    }
  }

  // Get daily summary report
  async getDailySummary(date = null) {
    try {
      const params = date ? `?date=${date}` : '';
      const response = await authAxios.get(`${API_URL}/summary${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch daily summary' };
    }
  }

  // Send daily summary to Telegram
  async sendDailySummaryTelegram(date = null) {
    try {
      const response = await authAxios.post(`${API_URL}/send-telegram-summary`, {
        date
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send summary to Telegram' };
    }
  }
}

export default new DailyReportService(); 