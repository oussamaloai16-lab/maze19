// services/taskService.js
import axios from 'axios';

const baseUrl = import.meta.env.VITE_BASE_URL;
const API_URL = `${baseUrl}/tasks`;

class TaskService {
  async getAllTasks(filters = {}) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        params: filters
      };
      
      const response = await axios.get(API_URL, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to fetch tasks';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to fetch tasks';
      }
    }
  }

  async getTasksKanban(filters = {}) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        params: filters
      };
      
      const response = await axios.get(`${API_URL}/kanban`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching kanban data:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to fetch kanban data';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to fetch kanban data';
      }
    }
  }

  async getTaskStats(filters = {}) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        params: filters
      };
      
      const response = await axios.get(`${API_URL}/stats`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching task stats:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to fetch task stats';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to fetch task stats';
      }
    }
  }

  async getMyTasks(filters = {}) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        params: filters
      };
      
      const response = await axios.get(`${API_URL}/my-tasks`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to fetch my tasks';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to fetch my tasks';
      }
    }
  }

  async getTaskById(taskId) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/${taskId}`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to fetch task';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to fetch task';
      }
    }
  }

  async createTask(taskData) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log('Sending task data:', taskData);
      const response = await axios.post(API_URL, taskData, config);
      console.log('Task created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Task creation error:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw error.response.data.message || 'Failed to create task';
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw 'Network error - no response from server';
      } else {
        console.error('Request setup error:', error.message);
        throw error.message || 'Failed to create task';
      }
    }
  }

  async updateTask(taskId, updateData) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`${API_URL}/${taskId}`, updateData, config);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to update task';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to update task';
      }
    }
  }

  async updateTaskStatus(taskId, status, reason = '') {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.patch(`${API_URL}/${taskId}/status`, { status, reason }, config);
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to update task status';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to update task status';
      }
    }
  }

  async assignTask(taskId, assignedTo) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.patch(`${API_URL}/${taskId}/assign`, { assignedTo }, config);
      return response.data;
    } catch (error) {
      console.error('Error assigning task:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to assign task';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to assign task';
      }
    }
  }

  async updateProgress(taskId, progress) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.patch(`${API_URL}/${taskId}/progress`, { progress }, config);
      return response.data;
    } catch (error) {
      console.error('Error updating progress:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to update progress';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to update progress';
      }
    }
  }

  async addComment(taskId, content, isInternal = false) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/${taskId}/comments`, { content, isInternal }, config);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to add comment';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to add comment';
      }
    }
  }

  async addRevisionNote(taskId, note) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/${taskId}/revisions`, { note }, config);
      return response.data;
    } catch (error) {
      console.error('Error adding revision note:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to add revision note';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to add revision note';
      }
    }
  }

  async uploadAttachment(taskId, filename, url) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/${taskId}/attachments`, { filename, url }, config);
      return response.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to upload attachment';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to upload attachment';
      }
    }
  }

  async uploadDeliverable(taskId, filename, url, version = 1) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/${taskId}/deliverables`, { filename, url, version }, config);
      return response.data;
    } catch (error) {
      console.error('Error uploading deliverable:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to upload deliverable';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to upload deliverable';
      }
    }
  }

  async toggleTaskBlock(taskId, isBlocked, blockReason = '') {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.patch(`${API_URL}/${taskId}/block`, { isBlocked, blockReason }, config);
      return response.data;
    } catch (error) {
      console.error('Error toggling task block:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to toggle task block';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to toggle task block';
      }
    }
  }

  async toggleTaskUrgency(taskId, isUrgent) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.patch(`${API_URL}/${taskId}/urgency`, { isUrgent }, config);
      return response.data;
    } catch (error) {
      console.error('Error toggling task urgency:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to toggle task urgency';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to toggle task urgency';
      }
    }
  }

  async deleteTask(taskId) {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(`${API_URL}/${taskId}`, config);
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error);
      if (error.response) {
        throw error.response.data.message || 'Failed to delete task';
      } else if (error.request) {
        throw 'Network error - no response from server';
      } else {
        throw error.message || 'Failed to delete task';
      }
    }
  }
}

export default new TaskService(); 