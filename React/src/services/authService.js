import ROLES from '../../../Node/config/rbac/roles';

const API_URL = import.meta.env.VITE_BASE_URL;

// Helper function to flatten permissions from role
const flattenPermissions = (roleObj) => {
  if (!roleObj || !roleObj.permissions) return [];
  
  const permissions = [];
  
  roleObj.permissions.forEach(permission => {
    const resource = permission.resource;
    permission.actions.forEach(action => {
      permissions.push(`${resource}:${action}`);
    });
  });
  
  return permissions;
};

// Get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to get headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const authService = {
  // Traditional Sign In
  signIn: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to sign in');
      }
      
      // Get response data
      const data = await response.json();
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Enrich user data with permissions based on role
      if (data.user && data.user.role) {
        // Convert role name to uppercase and replace spaces with underscores for matching
        const roleKey = data.user.role.toUpperCase().replace(/\s+/g, '_');
        
        // Find user's role in ROLES object
        if (ROLES[roleKey]) {
          // Add permissions array to user data
          data.user.permissions = flattenPermissions(ROLES[roleKey]);
          
          // Store enriched user data
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
      }
      
      return data;
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  },

  // The rest of your auth service methods remain the same
  signUp: async (username, email, password, cpassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, cpassword }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      // If the signup returns user data with role, enrich it with permissions
      if (data.user && data.user.role) {
        const roleKey = data.user.role.toUpperCase().replace(/\s+/g, '_');
        
        if (ROLES[roleKey]) {
          data.user.permissions = flattenPermissions(ROLES[roleKey]);
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Check Authentication Status - Fixed for consistency
  checkAuth: async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw { status: 401, message: 'No token available' };
      }

      const response = await fetch(`${API_URL}/auth/homepage`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw { 
          status: response.status, 
          message: response.status === 401 || response.status === 403 ? 'Not authenticated' : 'Server error' 
        };
      }

      const data = await response.json();
      
      // Enrich user with permissions if they have a role
      if (data.user && data.user.role) {
        const roleKey = data.user.role.toUpperCase().replace(/\s+/g, '_');
        
        if (ROLES[roleKey]) {
          data.user.permissions = flattenPermissions(ROLES[roleKey]);
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get Current User Data - Updated for consistency
  getCurrentUser: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/homepage`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get user data');
      }

      const data = await response.json();
      
      // Enrich user with permissions if they have a role
      if (data.user && data.user.role) {
        const roleKey = data.user.role.toUpperCase().replace(/\s+/g, '_');
        
        if (ROLES[roleKey]) {
          data.user.permissions = flattenPermissions(ROLES[roleKey]);
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // User Logout
  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/signout`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        console.warn('Logout request failed, but clearing local storage anyway');
      }

      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error on logout - always clear storage
    } finally {
      // Always clear local storage on logout
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
  },

  // Other methods remain the same...
  googleSignIn: () => {
    window.location.href = `${API_URL}/auth/google`;
  },

  checkGoogleAuthStatus: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login/success`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Google');
      }

      const data = await response.json();
      
      // Enrich user with permissions if they have a role
      if (data.user && data.user.role) {
        const roleKey = data.user.role.toUpperCase().replace(/\s+/g, '_');
        
        if (ROLES[roleKey]) {
          data.user.permissions = flattenPermissions(ROLES[roleKey]);
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Password Reset Request
  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process password reset');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Change Password
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ oldPassword, newPassword }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Handle Google OAuth Callback
  handleGoogleCallback: async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      
      if (error) {
        throw new Error(error);
      }

      // Check if authentication was successful
      const authStatus = await authService.checkGoogleAuthStatus();
      
      if (authStatus.success) {
        window.location.href = '/homepage';
        return authStatus;
      } else {
        throw new Error('Google authentication failed');
      }
    } catch (error) {
      throw error;
    }
  }
};