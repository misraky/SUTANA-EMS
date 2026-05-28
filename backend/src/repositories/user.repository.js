const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'id');
  }
  async findByUsername(username) {
    try {
      const user = await this.query()
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
        .select(
          'users.id',
          'users.full_name',
          'users.email',
          'users.phone',
          'users.password',
          'users.department_id',
          'departments.name as department_name',
          'users.status_id',
          'user_statuses.status_code as status',
          'user_statuses.status_name as status_name',
          'user_statuses.color_hex as status_color',
          'users.last_login',
          'users.must_change_password',
          'users.two_factor_enabled',
          'users.two_factor_secret',
          'users.created_at',
          'users.updated_at',
          'users.created_by',
          db.raw('GROUP_CONCAT(DISTINCT roles.name) as role_names'),
          db.raw('GROUP_CONCAT(DISTINCT roles.permissions) as permission_sets')
        )
        .where(function() {
          this.where('users.email', username.toLowerCase())
            .orWhere('users.phone', username);
        })
        .whereNull('users.deleted_at')
        .groupBy(
          'users.id',
          'departments.name',
          'user_statuses.status_code',
          'user_statuses.status_name',
          'user_statuses.color_hex'
        )
        .first();
      return user || null;
    } catch (error) {
      logger.error('UserRepository.findByUsername error:', error.message);
      throw error;
    }
  }
  async findByEmail(email) {
    try {
      const user = await this.query()
        .where('email', email.toLowerCase())
        .whereNull('deleted_at')
        .first();
      return user || null;
    } catch (error) {
      logger.error('UserRepository.findByEmail error:', error.message);
      throw error;
    }
  }
  async findByPhone(phone) {
    try {
      const user = await this.query()
        .where('phone', phone)
        .whereNull('deleted_at')
        .first();
      return user || null;
    } catch (error) {
      logger.error('UserRepository.findByPhone error:', error.message);
      throw error;
    }
  }
  async getUserWithDetails(userId) {
    try {
      const user = await this.query()
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
        .leftJoin('users as creator', 'users.created_by', 'creator.id')
        .select(
          'users.*',
          'departments.name as department_name',
          'user_statuses.status_code as status',
          'user_statuses.status_name as status_name',
          'user_statuses.color_hex as status_color',
          'creator.full_name as created_by_name'
        )
        .where('users.id', userId)
        .whereNull('users.deleted_at')
        .first();
      if (user) {
        const roles = await db('user_roles')
          .leftJoin('roles', 'user_roles.role_id', 'roles.id')
          .leftJoin('users as assigner', 'user_roles.assigned_by', 'assigner.id')
          .where('user_roles.user_id', userId)
          .select(
            'roles.id',
            'roles.name',
            'roles.description',
            'user_roles.assigned_at',
            'assigner.full_name as assigned_by_name'
          );
        user.roles = roles;
      }
      return user || null;
    } catch (error) {
      logger.error('UserRepository.getUserWithDetails error:', error.message);
      throw error;
    }
  }
  async findAllWithFilters(options = {}) {
    const {
      page = 1,
      limit = 25,
      search,
      departmentId,
      roleId,
      statusId
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = this.query()
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
        .select(
          'users.id',
          'users.full_name',
          'users.email',
          'users.phone',
          'users.department_id',
          'departments.name as department_name',
          'users.status_id',
          'user_statuses.status_code as status',
          'user_statuses.status_name as status_name',
          'user_statuses.color_hex as status_color',
          'users.last_login',
          'users.created_at',
          'users.must_change_password',
          'users.two_factor_enabled'
        )
        .whereNull('users.deleted_at');
      if (search) {
        query = query.where(function() {
          this.where('users.full_name', 'like', `%${search}%`)
            .orWhere('users.email', 'like', `%${search}%`)
            .orWhere('users.phone', 'like', `%${search}%`);
        });
      }
      if (departmentId) {
        query = query.where('users.department_id', departmentId);
      }
      if (statusId) {
        query = query.where('users.status_id', statusId);
      }
      if (roleId) {
        query = query.whereExists(
          db('user_roles')
            .whereRaw('user_roles.user_id = users.id')
            .where('user_roles.role_id', roleId)
        );
      }
      const countQuery = query.clone();
      const total = await countQuery.count('users.id as count').first();
      const users = await query
        .orderBy('users.created_at', 'desc')
        .limit(limit)
        .offset(offset);
      for (const user of users) {
        const roles = await db('user_roles')
          .leftJoin('roles', 'user_roles.role_id', 'roles.id')
          .where('user_roles.user_id', user.id)
          .select('roles.id', 'roles.name');
        user.roles = roles;
      }
      return {
        data: users,
        pagination: {
          page,
          limit,
          total: parseInt(total?.count || 0),
          totalPages: Math.ceil((total?.count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('UserRepository.findAllWithFilters error:', error.message);
      throw error;
    }
  }
  async findByRole(roleId, limit = 100) {
    try {
      const users = await this.query()
        .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
        .select('users.*')
        .where('user_roles.role_id', roleId)
        .whereNull('users.deleted_at')
        .limit(limit);
      return users;
    } catch (error) {
      logger.error('UserRepository.findByRole error:', error.message);
      throw error;
    }
  }
  async findByDepartment(departmentId) {
    try {
      const users = await this.query()
        .where('department_id', departmentId)
        .whereNull('deleted_at')
        .orderBy('full_name', 'asc');
      return users;
    } catch (error) {
      logger.error('UserRepository.findByDepartment error:', error.message);
      throw error;
    }
  }
  async findByStatus(status) {
    try {
      const statusRecord = await db('user_statuses')
        .where('status_code', status)
        .first();
      if (!statusRecord) return [];
      const users = await this.query()
        .where('status_id', statusRecord.id)
        .whereNull('deleted_at')
        .orderBy('full_name', 'asc');
      return users;
    } catch (error) {
      logger.error('UserRepository.findByStatus error:', error.message);
      throw error;
    }
  }
  async updateLastLogin(userId) {
    try {
      await this.update(userId, { last_login: db.fn.now() });
      return true;
    } catch (error) {
      logger.error('UserRepository.updateLastLogin error:', error.message);
      throw error;
    }
  }
  async updatePassword(userId, hashedPassword, mustChangePassword = false) {
    try {
      await this.update(userId, {
        password: hashedPassword,
        must_change_password: mustChangePassword,
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('UserRepository.updatePassword error:', error.message);
      throw error;
    }
  }
  async getUserRoles(userId) {
    try {
      const roles = await db('user_roles')
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .leftJoin('users as assigner', 'user_roles.assigned_by', 'assigner.id')
        .where('user_roles.user_id', userId)
        .select(
          'roles.id',
          'roles.name',
          'roles.description',
          'roles.permissions',
          'user_roles.assigned_at',
          'assigner.full_name as assigned_by_name'
        );
      return roles;
    } catch (error) {
      logger.error('UserRepository.getUserRoles error:', error.message);
      throw error;
    }
  }
  async assignRole(userId, roleId, assignedBy) {
    try {
      await db('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        assigned_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('UserRepository.assignRole error:', error.message);
      throw error;
    }
  }
  async removeRole(userId, roleId) {
    try {
      await db('user_roles')
        .where('user_id', userId)
        .where('role_id', roleId)
        .delete();
      return true;
    } catch (error) {
      logger.error('UserRepository.removeRole error:', error.message);
      throw error;
    }
  }
  async removeAllRoles(userId) {
    try {
      await db('user_roles')
        .where('user_id', userId)
        .delete();
      return true;
    } catch (error) {
      logger.error('UserRepository.removeAllRoles error:', error.message);
      throw error;
    }
  }
  async getUserActivity(userId, days = 30) {
    try {
      const startDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
      const activityCount = await db('audit_logs')
        .where('user_id', userId)
        .where('created_at', '>=', startDate)
        .count('id as count')
        .first();
      const lastActivity = await db('audit_logs')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .first();
      const actionBreakdown = await db('audit_logs')
        .where('user_id', userId)
        .where('created_at', '>=', startDate)
        .select('action', db.raw('COUNT(*) as count'))
        .groupBy('action')
        .orderBy('count', 'desc')
        .limit(10);
      return {
        totalActivities: parseInt(activityCount?.count || 0),
        lastActivityAt: lastActivity?.created_at,
        lastActivityAction: lastActivity?.action,
        actionBreakdown
      };
    } catch (error) {
      logger.error('UserRepository.getUserActivity error:', error.message);
      throw error;
    }
  }
  async findByResetToken(token) {
    try {
      const resetRecord = await db('password_resets')
        .where('token', token)
        .where('expires_at', '>', db.fn.now())
        .where('used', false)
        .first();
      if (!resetRecord) return null;
      const user = await this.findById(resetRecord.user_id);
      return user;
    } catch (error) {
      logger.error('UserRepository.findByResetToken error:', error.message);
      throw error;
    }
  }
  async createResetToken(userId, hashedToken, expiresAt) {
    try {
      const [id] = await db('password_resets').insert({
        user_id: userId,
        token: hashedToken,
        expires_at: expiresAt,
        created_at: db.fn.now()
      });
      return id;
    } catch (error) {
      logger.error('UserRepository.createResetToken error:', error.message);
      throw error;
    }
  }
  async markResetTokenUsed(tokenId) {
    try {
      await db('password_resets')
        .where('id', tokenId)
        .update({ used: true });
      return true;
    } catch (error) {
      logger.error('UserRepository.markResetTokenUsed error:', error.message);
      throw error;
    }
  }
  async getPasswordHistory(userId, limit = 5) {
    try {
      const history = await db('password_history')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit);
      return history;
    } catch (error) {
      logger.error('UserRepository.getPasswordHistory error:', error.message);
      throw error;
    }
  }
  async addToPasswordHistory(userId, passwordHash) {
    try {
      const [id] = await db('password_history').insert({
        user_id: userId,
        password_hash: passwordHash,
        created_at: db.fn.now()
      });
      return id;
    } catch (error) {
      logger.error('UserRepository.addToPasswordHistory error:', error.message);
      throw error;
    }
  }
  async getInactiveUsers(days = 30) {
    try {
      const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
      const users = await this.query()
        .where('last_login', '<', cutoffDate)
        .orWhereNull('last_login')
        .whereNull('deleted_at')
        .where('status', 'active')
        .select('id', 'full_name', 'email', 'phone', 'last_login');
      return users;
    } catch (error) {
      logger.error('UserRepository.getInactiveUsers error:', error.message);
      throw error;
    }
  }
  async exportUsers(filters = {}) {
    const { search, departmentId, statusId } = filters;
    try {
      let query = this.query()
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
        .select(
          'users.id',
          'users.full_name',
          'users.email',
          'users.phone',
          'departments.name as department',
          'user_statuses.status_name as status',
          'users.last_login',
          'users.created_at'
        )
        .whereNull('users.deleted_at');
      if (search) {
        query = query.where(function() {
          this.where('users.full_name', 'like', `%${search}%`)
            .orWhere('users.email', 'like', `%${search}%`)
            .orWhere('users.phone', 'like', `%${search}%`);
        });
      }
      if (departmentId) {
        query = query.where('users.department_id', departmentId);
      }
      if (statusId) {
        query = query.where('users.status_id', statusId);
      }
      const users = await query.orderBy('users.full_name', 'asc');
      for (const user of users) {
        const roles = await db('user_roles')
          .leftJoin('roles', 'user_roles.role_id', 'roles.id')
          .where('user_roles.user_id', user.id)
          .select('roles.name');
        user.roles = roles.map(r => r.name).join(', ');
      }
      return users;
    } catch (error) {
      logger.error('UserRepository.exportUsers error:', error.message);
      throw error;
    }
  }
}
module.exports = UserRepository;
