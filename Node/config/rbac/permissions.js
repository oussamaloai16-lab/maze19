// config/rbac/permissions.js - Updated
const PERMISSIONS = {
  USERS: {
    READ: 'users:read',
    CREATE: 'users:create',
    UPDATE: 'users:update',
    DELETE: 'users:delete'
  },
  ORDERS: {
    READ: 'orders:read',
    CREATE: 'orders:create',
    UPDATE: 'orders:update',
    DELETE: 'orders:delete',
    CONFIRM: 'orders:confirm',
    VALIDATE: 'orders:validate'
  },
  PAYMENTS: {
    READ: 'payments:read',
    CREATE: 'payments:create',
    UPDATE: 'payments:update',
    APPROVE: 'payments:approve',
    MARK_COMPLETED: 'payments:mark_completed'
  },
  TRANSACTIONS: {
    READ: 'transactions:read',
    CREATE: 'transactions:create',
    UPDATE: 'transactions:update',
    DELETE: 'transactions:delete'
  },
  SUGGESTED_CLIENTS: {
    READ: 'suggested_clients:read',
    CREATE: 'suggested_clients:create',
    UPDATE: 'suggested_clients:update',
    DELETE: 'suggested_clients:delete',
    CALL: 'suggested_clients:call',
    VALIDATE: 'suggested_clients:validate'
  },
  APPOINTMENTS: {
    READ: 'appointments:read',
    CREATE: 'appointments:create',
    UPDATE: 'appointments:update',
    SCHEDULE: 'appointments:schedule'
  },
  SERVICES: {
    READ: 'services:read',
    CREATE: 'services:create',
    UPDATE: 'services:update',
    UPLOAD: 'services:upload',
    MARK_COMPLETED: 'services:mark_completed'
  },
  TASKS: {
    READ: 'tasks:read',
    CREATE: 'tasks:create',
    UPDATE: 'tasks:update',
    DELETE: 'tasks:delete',
    ASSIGN: 'tasks:assign',
    COMMENT: 'tasks:comment',
    UPLOAD: 'tasks:upload'
  },
  REPORTS: {
    READ: 'reports:read',
    CREATE: 'reports:create',
    ANALYTICS: 'reports:analytics'
  },
  PAYMENT_PLANS: {
    READ: 'payment_plans:read',
    CREATE: 'payment_plans:create',
    UPDATE: 'payment_plans:update',
    DELETE: 'payment_plans:delete'
  },
  COMMISSIONS: {
    READ: 'commissions:read',
    CALCULATE: 'commissions:calculate',
    UPDATE: 'commissions:update'
  },
  CHAT: {
    READ: 'chat:read',
    SEND: 'chat:send'
  },
  FILES: {
    UPLOAD: 'files:upload',
    DOWNLOAD: 'files:download'
  },
  STUDIO: {
    SCHEDULE: 'studio:schedule',
    MANAGE: 'studio:manage'
  }
};

export default PERMISSIONS;