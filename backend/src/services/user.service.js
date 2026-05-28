const { db, transaction } = require('../config/database');
const config = require('../config/env');
const {
  hashPassword,
  generateTemporaryPassword,
  validatePasswordStrength,
  getPermissionsForRoles
} = require('../config/auth');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const { AppError } = require('../utils/AppError');
const getAllUsers = async (filters) => {
  const { page = 1, limit = 25, search, departmentId, roleId, statusId } = filters;
  const offset = (page - 1) * limit;
  let query = db('users')
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
  const total = await countQuery.count('users.id as total').first();
  const users = await query
    .orderBy('users.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  for (const user of users) {
    const roles = await db('user_roles')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', user.id)
      .select('roles.id', 'roles.name', 'roles.permissions');
    user.roles = roles;
  }
  return {
    users,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getUserById = async (userId) => {
  const user = await db('users')
    .leftJoin('departments', 'users.department_id', 'departments.id')
    .leftJoin('user_statuses', 'users.status_id', 'user_statuses.id')
    .select(
      'users.*',
      'departments.name as department_name',
      'user_statuses.status_code as status',
      'user_statuses.status_name as status_name'
    )
    .where('users.id', userId)
    .whereNull('users.deleted_at')
    .first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const roles = await db('user_roles')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', userId)
    .select('roles.id', 'roles.name', 'roles.permissions');
  user.roles = roles;
  const roleNames = roles.map(r => r.name);
  user.permissions = getPermissionsForRoles(roleNames);
  delete user.password;
  delete user.two_factor_secret;
  return user;
};
const createUser = async (userData, createdBy, ip) => {
  const { fullName, email, phone, departmentId, roleIds, statusId } = userData;
  const existingUser = await db('users')
    .where('email', email.toLowerCase())
    .orWhere('phone', phone)
    .first();
  if (existingUser) {
    throw new AppError('User with this email or phone already exists', 400);
  }
  const tempPassword = generateTemporaryPassword();
  const hashedPassword = await hashPassword(tempPassword);
  let finalStatusId = statusId;
  if (!finalStatusId) {
    const activeStatus = await db('user_statuses').where('status_code', 'active').first();
    finalStatusId = activeStatus.id;
  }
  const result = await transaction(async (trx) => {
    const [userId] = await trx('users').insert({
      full_name: fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      department_id: departmentId,
      status_id: finalStatusId,
      must_change_password: true,
      created_by: createdBy,
      created_at: db.fn.now()
    });
    for (const roleId of roleIds) {
      await trx('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: createdBy,
        assigned_at: db.fn.now()
      });
    }
    return userId;
  });
  await sendEmail({
    to: email,
    subject: 'Welcome to Sutana EMS - Your Account Created',
    template: 'welcome-user',
    data: {
      name: fullName,
      email,
      temporaryPassword: tempPassword,
      loginUrl: `${config.frontendUrl}/login`
    }
  });
  await sendSMS({
    to: phone,
    message: `Welcome ${fullName} to Sutana EMS! Use email ${email} and temporary password sent to your email to login. Please change your password after first login.`
  }).catch(() => {});
  await audit('USER_CREATED', result, {
    ip,
    details: { fullName, email, phone, departmentId, roleIds }
  });
  return { userId: result, email, temporaryPassword: tempPassword };
};
const updateUser = async (userId, updateData, updatedBy, ip) => {
  const { fullName, email, phone, departmentId, roleIds, statusId } = updateData;
  const user = await db('users').where('id', userId).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (userId === updatedBy && roleIds) {
    const currentRoles = await db('user_roles').where('user_id', userId).select('role_id');
    const hasAdminRole = currentRoles.some(r => r.role_id === 1);
    const willHaveAdminRole = roleIds.includes(1);
    if (hasAdminRole && !willHaveAdminRole) {
      throw new AppError('Cannot remove your own Admin role. This would lock you out.', 400);
    }
  }
  if (email || phone) {
    const duplicateQuery = db('users')
      .where('id', '!=', userId)
      .whereNull('deleted_at');
    if (email) {
      duplicateQuery.andWhere(function() {
        this.where('email', email.toLowerCase());
      });
    }
    if (phone) {
      duplicateQuery.orWhere('phone', phone);
    }
    const duplicate = await duplicateQuery.first();
    if (duplicate) {
      throw new AppError('Another user with this email or phone already exists', 400);
    }
  }
  const updateFields = {};
  if (fullName) updateFields.full_name = fullName;
  if (email) updateFields.email = email.toLowerCase();
  if (phone) updateFields.phone = phone;
  if (departmentId) updateFields.department_id = departmentId;
  if (statusId) updateFields.status_id = statusId;
  updateFields.updated_at = db.fn.now();
  await transaction(async (trx) => {
    if (Object.keys(updateFields).length > 0) {
      await trx('users').where('id', userId).update(updateFields);
    }
    if (roleIds && roleIds.length > 0) {
      await trx('user_roles').where('user_id', userId).delete();
      for (const roleId of roleIds) {
        await trx('user_roles').insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: updatedBy,
          assigned_at: db.fn.now()
        });
      }
    }
  });
  await audit('USER_UPDATED', userId, {
    ip,
    details: { updates: Object.keys(updateFields), roleChanged: !!roleIds }
  });
  return { updated: true };
};
const deleteUser = async (userId, deletedBy, ip) => {
  if (userId === deletedBy) {
    throw new AppError('Cannot delete your own account', 400);
  }
  const user = await db('users').where('id', userId).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const adminCount = await db('user_roles')
    .where('role_id', 1)
    .count('user_id as count')
    .first();
  const userRoles = await db('user_roles').where('user_id', userId).select('role_id');
  const isAdmin = userRoles.some(r => r.role_id === 1);
  if (isAdmin && adminCount.count <= 1) {
    throw new AppError('Cannot delete the last Admin user', 400);
  }
  await db('users')
    .where('id', userId)
    .update({
      status: 'deleted',
      deleted_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  await audit('USER_DELETED', userId, { ip, details: { deletedBy } });
  return { deleted: true };
};
const restoreUser = async (userId, restoredBy, ip) => {
  const user = await db('users').where('id', userId).whereNotNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found or not deleted', 404);
  }
  const deletedAt = new Date(user.deleted_at);
  const daysSinceDelete = (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelete > 30) {
    throw new AppError('Cannot restore user after 30 days of deletion', 400);
  }
  const activeStatus = await db('user_statuses').where('status_code', 'active').first();
  await db('users')
    .where('id', userId)
    .update({
      status_id: activeStatus.id,
      deleted_at: null,
      updated_at: db.fn.now()
    });
  await audit('USER_RESTORED', userId, { ip, details: { restoredBy } });
  return { restored: true };
};
const forcePasswordReset = async (userId, resetBy, ip) => {
  const user = await db('users').where('id', userId).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const tempPassword = generateTemporaryPassword();
  const hashedPassword = await hashPassword(tempPassword);
  await transaction(async (trx) => {
    await trx('password_history').insert({
      user_id: userId,
      password_hash: user.password
    });
    await trx('users')
      .where('id', userId)
      .update({
        password: hashedPassword,
        must_change_password: true,
        updated_at: db.fn.now()
      });
  });
  await sendEmail({
    to: user.email,
    subject: 'Password Reset by Administrator',
    template: 'force-password-reset',
    data: {
      name: user.full_name,
      temporaryPassword: tempPassword,
      loginUrl: `${config.frontendUrl}/login`
    }
  });
  await audit('FORCE_PASSWORD_RESET', userId, { ip, details: { resetBy } });
  return { reset: true, temporaryPassword: tempPassword };
};
const getUserPermissions = async (userId) => {
  const user = await db('users').where('id', userId).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const roles = await db('user_roles')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', userId)
    .select('roles.name', 'roles.permissions');
  const roleNames = roles.map(r => r.name);
  const permissions = getPermissionsForRoles(roleNames);
  return {
    userId,
    roles: roleNames,
    permissions
  };
};
const assignRoles = async (userId, roleIds, assignedBy, ip) => {
  const user = await db('users').where('id', userId).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  await transaction(async (trx) => {
    await trx('user_roles').where('user_id', userId).delete();
    for (const roleId of roleIds) {
      await trx('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        assigned_at: db.fn.now()
      });
    }
  });
  await audit('ROLES_ASSIGNED', userId, { ip, details: { roleIds, assignedBy } });
  return { assigned: true };
};
const removeRole = async (userId, roleId, removedBy, ip) => {
  if (roleId === 1) {
    const adminCount = await db('user_roles')
      .where('role_id', 1)
      .count('user_id as count')
      .first();
    if (adminCount.count <= 1) {
      throw new AppError('Cannot remove the last Admin role', 400);
    }
  }
  const user = await db('users').where('id', userId).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  await db('user_roles')
    .where('user_id', userId)
    .where('role_id', roleId)
    .delete();
  await audit('ROLE_REMOVED', userId, { ip, details: { roleId, removedBy } });
  return { removed: true };
};
const getDepartments = async () => {
  const departments = await db('departments')
    .select('id', 'name', 'description')
    .orderBy('name');
  return departments;
};
const getRoles = async () => {
  const roles = await db('roles')
    .select('id', 'name', 'description')
    .orderBy('name');
  return roles;
};
const exportUsers = async (filters) => {
  const { search, departmentId, statusId } = filters;
  let query = db('users')
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
};
module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  forcePasswordReset,
  getUserPermissions,
  assignRoles,
  removeRole,
  getDepartments,
  getRoles,
  exportUsers
};
