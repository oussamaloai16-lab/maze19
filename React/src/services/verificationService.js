// src/services/verificationService.js
import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;


const API_URL = baseUrl;

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

class VerificationService {
  // Verify email with token
  async verifyEmail(token) {
    try {
      const response = await axios.get(`${API_URL}/verify/${token}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Verification failed';
      throw new Error(errorMessage);
    }
  }
  
  // Resend verification email (when logged in)
  async resendVerification() {
    try {
      const response = await authAxios.post(`${API_URL}/resend`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      throw new Error(errorMessage);
    }
  }
  
  // Resend verification email (when not logged in)
  async resendPublicVerification(email) {
    try {
      const response = await axios.post(`${API_URL}/public/resend`, { email });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      throw new Error(errorMessage);
    }
  }
  
  // Check if user is verified
  async checkVerificationStatus() {
    try {
      const response = await authAxios.get(`${API_URL}/status`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to check verification status';
      throw new Error(errorMessage);
    }
  }
}

export default new VerificationService();