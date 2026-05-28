const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class RoleRepository extends BaseRepository {
  constructor() {
    super('roles', 'id');
  }
  async findByName(name) {
    try {
      const role = await this.query()
        .where('name', name)
        .first();
      return role || null;
    } catch (error) {
      logger.error('RoleRepository.findByName error:', error.message);
      throw error;
    }
  }
  async findAllWithUserCount() {
    try {
      const roles = await this.query()
        .leftJoin('user_roles', 'roles.id', 'user_roles.role_id')
        .select(
          'roles.*',
          db.raw('COUNT(DISTINCT user_roles.user_id) as user_count')
        )
        .groupBy('roles.id')
        .orderBy('roles.name', 'asc');
      return roles;
    } catch (error) {
      logger.error('RoleRepository.findAllWithUserCount error:', error.message);
      throw error;
    }
  }
  async getRoleWithUsers(roleId) {
    try {
      const role = await this.findById(roleId);
      if (!role) return null;
      const users = await db('users')
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .select(
          'users.id',
          'users.full_name',
          'users.email',
          'users.phone',
          'departments.name as department',
          'users.last_login'
        )
        .where('user_roles.role_id', roleId)
        .whereNull('users.deleted_at');
      role.users = users;
      return role;
    } catch (error) {
      logger.error('RoleRepository.getRoleWithUsers error:', error.message);
      throw error;
    }
  }
  async getPermissions(roleId) {
    try {
      const role = await this.findById(roleId);
      if (!role) return {};
      if (typeof role.permissions === 'string') {
        return JSON.parse(role.permissions);
      }
      return role.permissions || {};
    } catch (error) {
      logger.error('RoleRepository.getPermissions error:', error.message);
      return {};
    }
  }
  async updatePermissions(roleId, permissions) {
    try {
      await this.update(roleId, {
        permissions: JSON.stringify(permissions),
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('RoleRepository.updatePermissions error:', error.message);
      throw error;
    }
  }
  async hasPermission(roleId, resource, action) {
    try {
      const permissions = await this.getPermissions(roleId);
      if (permissions.all && permissions.all.includes('*')) {
        return true;
      }
      if (permissions[resource] && permissions[resource].includes(action)) {
        return true;
      }
      if (permissions[resource] && permissions[resource].includes('*')) {
        return true;
      }
      return false;
    } catch (error) {
      logger.error('RoleRepository.hasPermission error:', error.message);
      return false;
    }
  }
  async getFlattenedPermissions(roleId) {
    try {
      const permissions = await this.getPermissions(roleId);
      const flattened = [];
      if (permissions.all && permissions.all.includes('*')) {
        return ['*'];
      }
      for (const resource in permissions) {
        for (const action of permissions[resource]) {
          flattened.push(`${resource}:${action}`);
        }
      }
      return flattened;
    } catch (error) {
      logger.error('RoleRepository.getFlattenedPermissions error:', error.message);
      return [];
    }
  }
  async getUsersByRole(roleId, limit = 100) {
    try {
      const users = await db('users')
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .select('users.id', 'users.full_name', 'users.email', 'users.phone')
        .where('user_roles.role_id', roleId)
        .whereNull('users.deleted_at')
        .limit(limit);
      return users;
    } catch (error) {
      logger.error('RoleRepository.getUsersByRole error:', error.message);
      throw error;
    }
  }
  async getAvailablePermissions() {
    const permissions = {
      users: ['create', 'read', 'update', 'delete'],
      orders: ['create', 'read', 'update', 'approve'],
      inventory: ['create', 'read', 'update', 'delete'],
      pos: ['create', 'read', 'update'],
      reports: ['read', 'export'],
      dashboard: ['read'],
      settings: ['read', 'update'],
      backups: ['create', 'restore', 'delete']
    };
    return permissions;
  }
  async createDefaultRoles() {
    const defaultRoles = [
      {
        name: 'Admin',
        description: 'Full system access',
        permissions: { all: ['*'] }
      },
      {
        name: 'CEO',
        description: 'Strategic oversight and approvals',
        permissions: {
          reports: ['read', 'export'],
          dashboard: ['read'],
          approvals: ['discount', 'po']
        }
      },
      {
        name: 'Finance',
        description: 'Financial operations and reporting',
        permissions: {
          payments: ['create', 'read'],
          expenses: ['create', 'read', 'update'],
          reports: ['read', 'export']
        }
      },
      {
        name: 'Printing Supervisor',
        description: 'Printing order management',
        permissions: {
          orders: ['create', 'read', 'update', 'approve'],
          inventory: ['read'],
          tax_receipts: ['create', 'read']
        }
      },
      {
        name: 'Purchase',
        description: 'Supplier and PO management',
        permissions: {
          suppliers: ['create', 'read', 'update'],
          purchase_orders: ['create', 'read', 'update', 'approve']
        }
      },
      {
        name: 'Store Worker',
        description: 'Inventory management',
        permissions: {
          inventory: ['create', 'read', 'update'],
          receiving: ['create', 'read']
        }
      },
      {
        name: 'Sales/Cashier',
        description: 'POS operations',
        permissions: {
          pos: ['create', 'read', 'update'],
          customers: ['create', 'read']
        }
      },
      {
        name: 'Customer',
        description: 'Self-service portal',
        permissions: {
          orders: ['create', 'read'],
          profile: ['read', 'update']
        }
      }
    ];
    const created = [];
    for (const role of defaultRoles) {
      const existing = await this.findByName(role.name);
      if (!existing) {
        const id = await this.create({
          name: role.name,
          description: role.description,
          permissions: JSON.stringify(role.permissions),
          created_at: db.fn.now()
        });
        created.push(id);
      }
    }
    return created;
  }
  async getRoleCount() {
    try {
      const result = await this.query().count('id as count').first();
      return parseInt(result?.count || 0);
    } catch (error) {
      logger.error('RoleRepository.getRoleCount error:', error.message);
      return 0;
    }
  }
  async searchRoles(search, limit = 20) {
    try {
      const roles = await this.query()
        .where('name', 'like', `%${search}%`)
        .orWhere('description', 'like', `%${search}%`)
        .limit(limit)
        .orderBy('name', 'asc');
      return roles;
    } catch (error) {
      logger.error('RoleRepository.searchRoles error:', error.message);
      throw error;
    }
  }
  async getAssignableRoles(currentUserRoles) {
    try {
      let query = this.query().select('id', 'name', 'description');
      if (!currentUserRoles.includes('Admin')) {
        query = query.where('name', '!=', 'Admin');
      }
      const roles = await query.orderBy('name', 'asc');
      return roles;
    } catch (error) {
      logger.error('RoleRepository.getAssignableRoles error:', error.message);
      throw error;
    }
  }
  async bulkAssignRoles(assignments) {
    try {
      let assigned = 0;
      for (const assignment of assignments) {
        const exists = await db('user_roles')
          .where('user_id', assignment.userId)
          .where('role_id', assignment.roleId)
          .first();
        if (!exists) {
          await db('user_roles').insert({
            user_id: assignment.userId,
            role_id: assignment.roleId,
            assigned_by: assignment.assignedBy,
            assigned_at: db.fn.now()
          });
          assigned++;
        }
      }
      return assigned;
    } catch (error) {
      logger.error('RoleRepository.bulkAssignRoles error:', error.message);
      throw error;
    }
  }
}
module.exports = RoleRepository;
