class UserModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fullName = data.full_name || data.fullName || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.password = data.password || '';
    this.departmentId = data.department_id || data.departmentId || null;
    this.departmentName = data.department_name || data.departmentName || null;
    this.statusId = data.status_id || data.statusId || null;
    this.status = data.status || '';
    this.statusName = data.status_name || data.statusName || '';
    this.statusColor = data.status_color || data.statusColor || '';
    this.lastLogin = data.last_login || data.lastLogin || null;
    this.mustChangePassword = data.must_change_password || data.mustChangePassword || false;
    this.twoFactorEnabled = data.two_factor_enabled || data.twoFactorEnabled || false;
    this.twoFactorSecret = data.two_factor_secret || data.twoFactorSecret || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.createdByName = data.created_by_name || data.createdByName || null;
    this.roles = data.roles || [];
    this.permissions = data.permissions || [];
  }
  /**
   * Validate user data
   * @returns {Object} - { isValid, errors }
   */
  validate() {
    const errors = [];
    if (!this.fullName || this.fullName.length < 2 || this.fullName.length > 100) {
      errors.push('Full name must be between 2 and 100 characters');
    }
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email address is required');
    }
    if (!this.phone || !this.isValidEthiopianPhone(this.phone)) {
      errors.push('Valid Ethiopian phone number (09xxxxxxxx) is required');
    }
    if (this.password && this.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  isValidEthiopianPhone(phone) {
    const phoneRegex = /^09[0-9]{8}$/;
    return phoneRegex.test(phone);
  }
  hasRole(roleName) {
    return this.roles.some(role => role.name === roleName || role === roleName);
  }
  hasPermission(permission) {
    if (this.permissions.includes('*')) return true;
    if (this.permissions.includes(permission)) return true;
    const [resource, action] = permission.split(':');
    return this.permissions.includes(`${resource}:*`);
  }
  hasAnyRole(roleNames) {
    return roleNames.some(role => this.hasRole(role));
  }
  hasAllRoles(roleNames) {
    return roleNames.every(role => this.hasRole(role));
  }
  isActive() {
    return this.status === 'active' && !this.deletedAt;
  }
  isSuspended() {
    return this.status === 'suspended';
  }
  isDeleted() {
    return !!this.deletedAt || this.status === 'deleted';
  }
  getInitials() {
    if (!this.fullName) return '';
    return this.fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  /**
   * Get user display name (first name or full name)
   * @returns {string}
   */
  getDisplayName() {
    const parts = this.fullName.split(' ');
    return parts[0] || this.fullName;
  }
  /**
   * Get masked email (for security)
   * @returns {string}
   */
  getMaskedEmail() {
    if (!this.email) return '';
    const [local, domain] = this.email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.substring(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
  }
  /**
   * Get masked phone number
   * @returns {string}
   */
  getMaskedPhone() {
    if (!this.phone) return '';
    return `${this.phone.substring(0, 3)}****${this.phone.substring(7)}`;
  }
  /**
   * Convert to JSON (remove sensitive data)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      departmentId: this.departmentId,
      departmentName: this.departmentName,
      status: this.status,
      statusName: this.statusName,
      statusColor: this.statusColor,
      lastLogin: this.lastLogin,
      mustChangePassword: this.mustChangePassword,
      twoFactorEnabled: this.twoFactorEnabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      roles: this.roles,
      permissions: this.permissions
    };
  }
  /**
   * Create from database row
   * @param {Object} data - Database row
   * @returns {UserModel}
   */
  static fromDatabase(data) {
    return new UserModel(data);
  }
  /**
   * Create from API request
   * @param {Object} data - Request data
   * @returns {UserModel}
   */
  static fromRequest(data) {
    return new UserModel({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      department_id: data.departmentId,
      status_id: data.statusId,
      roles: data.roles || []
    });
  }
  /**
   * Get validation rules for user creation
   * @returns {Object}
   */
  static getCreationRules() {
    return {
      fullName: { required: true, min: 2, max: 100 },
      email: { required: true, type: 'email' },
      phone: { required: true, pattern: /^09[0-9]{8}$/ },
      departmentId: { required: true, type: 'integer', min: 1 },
      roleIds: { required: true, type: 'array', min: 1 }
    };
  }
  static getUpdateRules() {
    return {
      fullName: { min: 2, max: 100 },
      email: { type: 'email' },
      phone: { pattern: /^09[0-9]{8}$/ },
      departmentId: { type: 'integer', min: 1 },
      statusId: { type: 'integer', min: 1 }
    };
  }
}
module.exports = UserModel;
