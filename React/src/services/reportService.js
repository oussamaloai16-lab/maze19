const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

class ReportService {
  
  // Get all reports with filtering and pagination
  async getAllReports(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/reports?${queryString}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch reports');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  // Get report statistics
  async getReportStats(period = 30) {
    try {
      const response = await fetch(`${API_URL}/reports/stats?period=${period}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch report statistics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      throw error;
    }
  }

  // Get a single report by ID
  async getReport(id) {
    try {
      const response = await fetch(`${API_URL}/reports/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  // Get reports by date range
  async getReportsByDateRange(startDate, endDate, type = null) {
    try {
      const params = { startDate, endDate };
      if (type) params.type = type;
      
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/reports/date-range?${queryString}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch reports by date range');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching reports by date range:', error);
      throw error;
    }
  }

  // Create a new report manually
  async createReport(reportData) {
    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  // Update a report
  async updateReport(id, reportData) {
    try {
      const response = await fetch(`${API_URL}/reports/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  // Archive multiple reports
  async archiveReports(reportIds) {
    try {
      const response = await fetch(`${API_URL}/reports/archive`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reportIds })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to archive reports');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error archiving reports:', error);
      throw error;
    }
  }

  // Delete a report
  async deleteReport(id) {
    try {
      const response = await fetch(`${API_URL}/reports/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Helper methods for formatting
  formatReportType(type) {
    const typeMapping = {
      'daily_transaction_summary': 'Daily Transaction Summary',
      'detailed_daily_report': 'Detailed Daily Report',
      'daily_closers_report': 'Daily Closers Report',
      'comprehensive_report': 'Comprehensive Daily Report',
      'custom_report': 'Custom Report'
    };
    return typeMapping[type] || type;
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAmount(amount) {
    if (!amount) return '0 DZD';
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getStatusColor(status) {
    switch (status) {
      case 'sent':
        return 'green';
      case 'failed':
        return 'red';
      case 'generated':
        return 'blue';
      case 'archived':
        return 'gray';
      default:
        return 'gray';
    }
  }

  getTypeIcon(type) {
    switch (type) {
      case 'daily_transaction_summary':
        return '💰';
      case 'detailed_daily_report':
        return '📋';
      case 'daily_closers_report':
        return '📞';
      case 'comprehensive_report':
        return '📊';
      case 'custom_report':
        return '📝';
      default:
        return '📄';
    }
  }
}

export default new ReportService(); 