import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import PERMISSIONS from '../config/rbac/permissions.js';

const protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.Secret);

    // 3. Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Debug log to help identify issues
    console.log('Auth middleware - User info:', {
      userId: user._id,
      role: user.role,
      decodedToken: decoded
    });

    // 4. Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token or authorization failed'
    });
  }
};

export const validatePermissions = (user, requiredPermission) => {
  if (!user || !user.role) {
    return false;
  }

  // Get the role's permissions from the RBAC configuration
  const rolePermissions = PERMISSIONS[user.role];
  if (!rolePermissions) {
    return false;
  }

  // Check if the role has the required permission
  return rolePermissions.includes(requiredPermission);
};

export default protect;