import axios from 'axios';
import { getAuthToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create a new appointment
export const createAppointment = async (appointmentData) => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/appointments`, appointmentData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create appointment' };
  }
};

// Get all appointments for current user
export const getMyAppointments = async (page = 1, limit = 10, status) => {
  try {
    const token = getAuthToken();
    let url = `${API_URL}/appointments/my-appointments?page=${page}&limit=${limit}`;
    
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch appointments' };
  }
};

// Get studio schedule for a specific date
export const getStudioSchedule = async (date) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/appointments/studio-schedule?date=${date}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch studio schedule' };
  }
};

// Update appointment status
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const token = getAuthToken();
    const response = await axios.patch(`${API_URL}/appointments/${appointmentId}/status`, 
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update appointment status' };
  }
};

// Reschedule an appointment
export const rescheduleAppointment = async (appointmentId, scheduledAt) => {
  try {
    const token = getAuthToken();
    const response = await axios.patch(`${API_URL}/appointments/${appointmentId}/reschedule`, 
      { scheduledAt },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reschedule appointment' };
  }
}; 