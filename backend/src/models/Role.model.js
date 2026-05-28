class RoleModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.permissions = data.permissions || {};
    this.userCount = data.user_count || data.userCount || 0;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.users = data.users || [];
  }
  /**
   * Validate role data
   * @returns {Object} - { isValid, errors }
   */
  validate() {
    const errors = [];
    if (!this.name || this.name.length < 2 || this.name.length > 50) {
      errors.push('Role name must be between 2 and 50 characters');
    }
    if (this.description && this.description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  hasPermission(resource, action) {
    if (this.permissions.all && this.permissions.all.includes('*')) {
      return true;
    }
    if (this.permissions[resource] && this.permissions[resource].includes(action)) {
      return true;
    }
    if (this.permissions[resource] && this.permissions[resource].includes('*')) {
      return true;
    }
    return false;
  }
  getFlattenedPermissions() {
    const flattened = [];
    if (this.permissions.all && this.permissions.all.includes('*')) {
      return ['*'];
    }
    for (const resource in this.permissions) {
      for (const action of this.permissions[resource]) {
        flattened.push(`${resource}:${action}`);
      }
    }
    return flattened;
  }
  addPermission(resource, action) {
    if (!this.permissions[resource]) {
      this.permissions[resource] = [];
    }
    if (!this.permissions[resource].includes(action)) {
      this.permissions[resource].push(action);
    }
  }
  removePermission(resource, action) {
    if (this.permissions[resource]) {
      this.permissions[resource] = this.permissions[resource].filter(a => a !== action);
      if (this.permissions[resource].length === 0) {
        delete this.permissions[resource];
      }
    }
  }
  setPermissionsFromArray(permissions) {
    this.permissions = {};
    for (const perm of permissions) {
      if (perm === '*') {
        this.permissions = { all: ['*'] };
        return;
      }
      const [resource, action] = perm.split(':');
      if (!this.permissions[resource]) {
        this.permissions[resource] = [];
      }
      if (!this.permissions[resource].includes(action)) {
        this.permissions[resource].push(action);
      }
    }
  }
  isAdmin() {
    return this.name === 'Admin' || this.hasPermission('all', '*');
  }
  getPriority() {
    const priorities = {
      'Admin': 100,
      'CEO': 90,
      'Finance': 80,
      'Printing Supervisor': 70,
      'Purchase': 60,
      'Store Worker': 50,
      'Sales/Cashier': 40,
      'Customer': 10
    };
    return priorities[this.name] || 30;
  }
  isHigherPriorityThan(otherRole) {
    return this.getPriority() > otherRole.getPriority();
  }
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      permissions: this.permissions,
      userCount: this.userCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  static fromDatabase(data) {
    let permissions = data.permissions || {};
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        permissions = {};
      }
    }
    return new RoleModel({
      id: data.id,
      name: data.name,
      description: data.description,
      permissions,
      userCount: data.user_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      users: data.users || []
    });
  }
  static fromRequest(data) {
    const role = new RoleModel({
      name: data.name,
      description: data.description
    });
    if (data.permissions) {
      role.setPermissionsFromArray(data.permissions);
    }
    return role;
  }
  static getAvailablePermissions() {
    return {
      users: ['create', 'read', 'update', 'delete'],
      orders: ['create', 'read', 'update', 'approve'],
      inventory: ['create', 'read', 'update', 'delete'],
      pos: ['create', 'read', 'update'],
      reports: ['read', 'export'],
      dashboard: ['read'],
      settings: ['read', 'update'],
      backups: ['create', 'restore', 'delete'],
      suppliers: ['create', 'read', 'update', 'delete'],
      purchase_orders: ['create', 'read', 'update', 'approve'],
      expenses: ['create', 'read', 'update', 'delete', 'approve'],
      payments: ['create', 'read', 'update', 'refund'],
      customers: ['create', 'read', 'update', 'delete'],
      tax_receipts: ['create', 'read']
    };
  }
  static getPredefinedRoles() {
    return {
      Admin: {
        description: 'Full system access',
        permissions: { all: ['*'] }
      },
      CEO: {
        description: 'Strategic oversight and approvals',
        permissions: {
          reports: ['read', 'export'],
          dashboard: ['read'],
          approvals: ['discount', 'po']
        }
      },
      Finance: {
        description: 'Financial operations and reporting',
        permissions: {
          payments: ['create', 'read'],
          expenses: ['create', 'read', 'update'],
          reports: ['read', 'export']
        }
      },
      'Printing Supervisor': {
        description: 'Printing order management',
        permissions: {
          orders: ['create', 'read', 'update', 'approve'],
          inventory: ['read'],
          tax_receipts: ['create', 'read']
        }
      },
      Purchase: {
        description: 'Supplier and PO management',
        permissions: {
          suppliers: ['create', 'read', 'update'],
          purchase_orders: ['create', 'read', 'update', 'approve']
        }
      },
      'Store Worker': {
        description: 'Inventory management',
        permissions: {
          inventory: ['create', 'read', 'update'],
          receiving: ['create', 'read']
        }
      },
      'Sales/Cashier': {
        description: 'POS operations',
        permissions: {
          pos: ['create', 'read', 'update'],
          customers: ['create', 'read']
        }
      },
      Customer: {
        description: 'Self-service portal',
        permissions: {
          orders: ['create', 'read'],
          profile: ['read', 'update']
        }
      }
    };
  }
  static getCreationRules() {
    return {
      name: { required: true, min: 2, max: 50, unique: true },
      description: { max: 500 },
      permissions: { type: 'array' }
    };
  }
  static getUpdateRules() {
    return {
      name: { min: 2, max: 50 },
      description: { max: 500 },
      permissions: { type: 'array' }
    };
  }
}
module.exports = RoleModel;
