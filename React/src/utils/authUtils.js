// utils/authUtils.js - Secure authentication utilities

/**
 * Safely decode JWT token without verification (for client-side role reading only)
 * NOTE: This is only for UI purposes - backend always verifies tokens properly
 */
export const decodeJWTPayload = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Get user role from JWT token (not localStorage)
 * This is safe for UI decisions because backend always verifies the actual token
 */
export const getCurrentUserRole = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const payload = decodeJWTPayload(token);
    return payload?.role || null;
  } catch (error) {
    console.error('Error getting user role from token:', error);
    return null;
  }
};

/**
 * Get user ID from JWT token
 */
export const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const payload = decodeJWTPayload(token);
    return payload?.id || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
};

/**
 * Check if current user is authenticated (has valid token)
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const payload = decodeJWTPayload(token);
    if (!payload) return false;
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const payload = decodeJWTPayload(token);
    return payload?.exp ? new Date(payload.exp * 1000) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
};

/**
 * Check if user has a specific role
 * NOTE: This is for UI purposes only - backend always validates permissions
 */
export const hasRole = (requiredRole) => {
  const userRole = getCurrentUserRole();
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = () => {
  return hasRole('SUPER_ADMIN');
};

/**
 * Get auth headers for API requests
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}; 