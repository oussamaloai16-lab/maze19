// config/rbac/roles.js - Updated
const ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    permissions: [
      { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'orders', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'payments', actions: ['read', 'create', 'update', 'approve'] },
      { resource: 'transactions', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'suggested_clients', actions: ['read', 'create', 'update', 'delete', 'call', 'validate'] },
      { resource: 'appointments', actions: ['read', 'create', 'update'] },
      { resource: 'services', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'tasks', actions: ['read', 'create', 'update', 'delete', 'assign', 'comment', 'upload'] },
      { resource: 'reports', actions: ['read', 'create', 'analytics'] },
      { resource: 'payment_plans', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'commissions', actions: ['read', 'calculate', 'update'] },
      { resource: 'studio', actions: ['schedule', 'manage'] }
    ]
  },
  CHEF_DE_BUREAU: {
    name: 'Chef de Bureau',
    permissions: [
      { resource: 'orders', actions: ['read', 'update', 'validate'] },
      { resource: 'payments', actions: ['read', 'approve', 'mark_completed'] },
      { resource: 'transactions', actions: ['read', 'create', 'update'] },
      { resource: 'suggested_clients', actions: ['read', 'create', 'update', 'delete', 'call', 'validate'] },
      { resource: 'tasks', actions: ['read', 'create', 'update', 'assign', 'comment', 'upload'] },
      { resource: 'reports', actions: ['read'] },
      { resource: 'commissions', actions: ['read', 'calculate'] },
      { resource: 'users', actions: ['read'] },
      { resource: 'services', actions: ['read', 'create', 'update', 'mark_completed'] }
    ]
  },
  CLOSER: {
    name: 'CLOSER',
    permissions: [
      { resource: 'appointments', actions: ['read', 'create', 'update'] },
      { resource: 'suggested_clients', actions: ['read', 'create', 'update', 'delete', 'call', 'validate'] },
      { resource: 'tasks', actions: ['read', 'comment'] },
    ]
  },
  RECEPTIONIST: {
    name: 'Receptionist',
    permissions: [
      { resource: 'suggested_clients', actions: ['read', 'create'] },
      { resource: 'appointments', actions: ['read', 'create', 'update', 'schedule'] },
      { resource: 'tasks', actions: ['read'] },
      { resource: 'studio', actions: ['schedule'] },
      { resource: 'chat', actions: ['read', 'send'] }
    ]
  },
  GRAPHIC_DESIGNER: {
    name: 'Graphic Designer',
    permissions: [
      { resource: 'orders', actions: ['read'] },
      { resource: 'services', actions: ['read', 'update', 'upload', 'mark_completed'] },
      { resource: 'tasks', actions: ['read', 'update', 'comment', 'upload'] },
      { resource: 'chat', actions: ['read', 'send'] },
      { resource: 'files', actions: ['upload', 'download'] },
      { resource: 'services', actions: ['read', 'update', 'upload', 'mark_completed'] }
    ]
  },
  CONFIRMATION_TEAM: {
    name: 'Confirmation Team',
    permissions: [
      { resource: 'suggested_clients', actions: ['read', 'create'] },
      { resource: 'orders', actions: ['read', 'update', 'confirm'] },
      { resource: 'tasks', actions: ['read', 'comment'] },
      { resource: 'reports', actions: ['read'] },
      { resource: 'commissions', actions: ['read'] }
    ]
  },
  ACCOUNTANT: {
    name: 'Accountant',
    permissions: [
      { resource: 'suggested_clients', actions: ['read', 'create'] },
      { resource: 'payments', actions: ['read', 'create', 'update', 'mark_completed'] },
      { resource: 'transactions', actions: ['read', 'create', 'update'] },
      { resource: 'tasks', actions: ['read'] },
      { resource: 'reports', actions: ['read', 'create'] },
      { resource: 'commissions', actions: ['read', 'calculate'] }
    ]
  },
  CLIENT: {
    name: 'Client',
    permissions: [
      { resource: 'orders', actions: ['read', 'create'] },
      { resource: 'payments', actions: ['read'] },
      { resource: 'appointments', actions: ['read'] },
      { resource: 'tasks', actions: ['read', 'comment'] },
      { resource: 'chat', actions: ['read', 'send'] },
      { resource: 'files', actions: ['download'] }
    ]
  }
};

export default ROLES;