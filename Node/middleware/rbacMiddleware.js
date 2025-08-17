import ROLES from '../config/rbac/roles.js';

const checkPermission = (resource, action) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({
        status: 'fail',
        message: 'User role not found'
      });
    }

    // Debug log to help identify issues
    console.log('Checking permission:', {
      userRole,
      resource,
      action,
      userPermissions: ROLES[userRole]?.permissions
    });

    const role = ROLES[userRole];
    if (!role) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid role'
      });
    }

    const permission = role.permissions.find(p => p.resource === resource);
    if (!permission || !permission.actions.includes(action)) {
      return res.status(403).json({
        status: 'fail',
        message: `Permission denied. Required: ${resource}:${action}`
      });
    }

    next();
  };
};

const checkMultiplePermissions = (permissions) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    // Debug log
    console.log('Checking multiple permissions:', {
      userRole,
      requiredPermissions: permissions,
      userPermissions: ROLES[userRole]?.permissions
    });

    const role = ROLES[userRole];

    if (!role) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid role'
      });
    }

    const hasAllPermissions = permissions.every(({ resource, action }) => {
      const permission = role.permissions.find(p => p.resource === resource);
      return permission && permission.actions.includes(action);
    });

    if (!hasAllPermissions) {
      return res.status(403).json({
        status: 'fail',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

export { checkPermission, checkMultiplePermissions };