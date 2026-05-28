const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class SettingsRepository extends BaseRepository {
  constructor() {
    super('settings', 'id');
  }
  async getByKey(key) {
    try {
      const setting = await this.query()
        .where('setting_key', key)
        .first();
      return setting || null;
    } catch (error) {
      logger.error('SettingsRepository.getByKey error:', error.message);
      throw error;
    }
  }
  async getValue(key, defaultValue = null) {
    try {
      const setting = await this.getByKey(key);
      if (!setting) return defaultValue;
      try {
        return JSON.parse(setting.setting_value);
      } catch {
        return setting.setting_value;
      }
    } catch (error) {
      logger.error('SettingsRepository.getValue error:', error.message);
      return defaultValue;
    }
  }
  async setValue(key, value, category = 'General', description = null, updatedBy = null) {
    try {
      const existing = await this.getByKey(key);
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (existing) {
        await this.update(existing.id, {
          setting_value: stringValue,
          updated_by: updatedBy,
          updated_at: db.fn.now()
        });
      } else {
        await this.create({
          setting_key: key,
          setting_value: stringValue,
          category,
          description,
          updated_by: updatedBy,
          updated_at: db.fn.now()
        });
      }
      return true;
    } catch (error) {
      logger.error('SettingsRepository.setValue error:', error.message);
      throw error;
    }
  }
  async getAllGrouped() {
    try {
      const settings = await this.query()
        .orderBy('category', 'asc')
        .orderBy('setting_key', 'asc');
      const grouped = {};
      for (const setting of settings) {
        let value = setting.setting_value;
        try {
          if (value && (value.startsWith('{') || value.startsWith('['))) {
            value = JSON.parse(value);
          }
        } catch {
        }
        if (!grouped[setting.category]) {
          grouped[setting.category] = [];
        }
        grouped[setting.category].push({
          id: setting.id,
          key: setting.setting_key,
          value,
          description: setting.description,
          updatedBy: setting.updated_by,
          updatedAt: setting.updated_at
        });
      }
      return grouped;
    } catch (error) {
      logger.error('SettingsRepository.getAllGrouped error:', error.message);
      throw error;
    }
  }
  async getByCategory(category) {
    try {
      const settings = await this.query()
        .where('category', category)
        .orderBy('setting_key', 'asc');
      return settings.map(setting => {
        let value = setting.setting_value;
        try {
          if (value && (value.startsWith('{') || value.startsWith('['))) {
            value = JSON.parse(value);
          }
        } catch {
        }
        return {
          id: setting.id,
          key: setting.setting_key,
          value,
          description: setting.description,
          updatedBy: setting.updated_by,
          updatedAt: setting.updated_at
        };
      });
    } catch (error) {
      logger.error('SettingsRepository.getByCategory error:', error.message);
      throw error;
    }
  }
  async deleteByKey(key) {
    try {
      const setting = await this.getByKey(key);
      if (!setting) return false;
      await this.delete(setting.id);
      return true;
    } catch (error) {
      logger.error('SettingsRepository.deleteByKey error:', error.message);
      throw error;
    }
  }
  async getCategories() {
    try {
      const categories = await this.query()
        .distinct('category')
        .orderBy('category', 'asc')
        .pluck('category');
      return categories;
    } catch (error) {
      logger.error('SettingsRepository.getCategories error:', error.message);
      throw error;
    }
  }
  async bulkUpdate(settings) {
    try {
      let updated = 0;
      for (const setting of settings) {
        const existing = await this.getByKey(setting.key);
        if (existing) {
          await this.update(existing.id, {
            setting_value: typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value),
            updated_by: setting.updatedBy,
            updated_at: db.fn.now()
          });
          updated++;
        }
      }
      return updated;
    } catch (error) {
      logger.error('SettingsRepository.bulkUpdate error:', error.message);
      throw error;
    }
  }
  async initializeDefaults() {
    const defaultSettings = [
      { key: 'system_name', value: 'Sutana EMS', category: 'General', description: 'System display name' },
      { key: 'timezone', value: 'Africa/Addis_Ababa', category: 'General', description: 'System timezone' },
      { key: 'date_format', value: 'YYYY-MM-DD', category: 'General', description: 'Date display format' },
      { key: 'currency', value: 'ETB', category: 'General', description: 'System currency' },
      { key: 'currency_symbol', value: 'Br', category: 'General', description: 'Currency symbol' },
      { key: 'tax_rate', value: '15', category: 'General', description: 'Default tax rate percentage' },
      { key: 'cashier_max_discount', value: '5', category: 'Business Rules', description: 'Max discount % for cashier without approval' },
      { key: 'manager_max_discount', value: '15', category: 'Business Rules', description: 'Max discount % for manager approval' },
      { key: 'gm_max_discount', value: '25', category: 'Business Rules', description: 'Max discount % for GM approval' },
      { key: 'high_value_po_threshold', value: '200000', category: 'Business Rules', description: 'PO amount requiring CEO approval' },
      { key: 'low_stock_threshold_percent', value: '20', category: 'Business Rules', description: 'Percentage to trigger low stock alert' },
      { key: 'session_timeout_minutes', value: '30', category: 'Security', description: 'Session inactivity timeout' },
      { key: 'max_failed_attempts', value: '5', category: 'Security', description: 'Login attempts before lockout' },
      { key: 'lockout_minutes', value: '15', category: 'Security', description: 'Account lockout duration' },
      { key: 'password_min_length', value: '8', category: 'Security', description: 'Minimum password length' },
      { key: 'password_require_uppercase', value: 'true', category: 'Security', description: 'Require uppercase letter in password' },
      { key: 'password_require_number', value: 'true', category: 'Security', description: 'Require number in password' },
      { key: 'password_require_special', value: 'true', category: 'Security', description: 'Require special character in password' },
      { key: 'password_history_count', value: '5', category: 'Security', description: 'Number of previous passwords to remember' },
      { key: 'max_concurrent_sessions', value: '3', category: 'Security', description: 'Maximum concurrent sessions per user' },
      { key: 'printing_base_price_a4', value: '0.50', category: 'Printing', description: 'Base price per page for A4 paper' },
      { key: 'printing_base_price_a5', value: '0.75', category: 'Printing', description: 'Base price per page for A5 paper' },
      { key: 'printing_base_price_a3', value: '1.00', category: 'Printing', description: 'Base price per page for A3 paper' },
      { key: 'printing_color_multiplier', value: '2.0', category: 'Printing', description: 'Price multiplier for color printing' },
      { key: 'printing_binding_spiral', value: '500', category: 'Printing', description: 'Binding cost for spiral binding' },
      { key: 'printing_binding_thermal', value: '300', category: 'Printing', description: 'Binding cost for thermal binding' },
      { key: 'email_notifications_enabled', value: 'true', category: 'Integration', description: 'Enable email notifications' },
      { key: 'sms_notifications_enabled', value: 'true', category: 'Integration', description: 'Enable SMS notifications' },
      { key: 'backup_enabled', value: 'true', category: 'Integration', description: 'Enable automatic backups' },
      { key: 'backup_frequency_hours', value: '6', category: 'Integration', description: 'Hours between backups' },
      { key: 'backup_retention_days', value: '30', category: 'Integration', description: 'Days to keep backups' }
    ];
    let created = 0;
    for (const setting of defaultSettings) {
      const existing = await this.getByKey(setting.key);
      if (!existing) {
        await this.create({
          setting_key: setting.key,
          setting_value: setting.value,
          category: setting.category,
          description: setting.description,
          updated_at: db.fn.now()
        });
        created++;
      }
    }
    logger.info(`Initialized ${created} default settings`);
    return created;
  }
  async getKeyValueMap() {
    try {
      const settings = await this.query();
      const map = {};
      for (const setting of settings) {
        let value = setting.setting_value;
        try {
          if (value && (value.startsWith('{') || value.startsWith('['))) {
            value = JSON.parse(value);
          }
        } catch {
        }
        map[setting.setting_key] = value;
      }
      return map;
    } catch (error) {
      logger.error('SettingsRepository.getKeyValueMap error:', error.message);
      return {};
    }
  }
  async getByUpdater(userId) {
    try {
      const settings = await this.query()
        .where('updated_by', userId)
        .orderBy('updated_at', 'desc');
      return settings;
    } catch (error) {
      logger.error('SettingsRepository.getByUpdater error:', error.message);
      throw error;
    }
  }
  async getRecentChanges(limit = 50) {
    try {
      const changes = await this.query()
        .leftJoin('users', 'settings.updated_by', 'users.id')
        .select(
          'settings.*',
          'users.full_name as updated_by_name'
        )
        .orderBy('settings.updated_at', 'desc')
        .limit(limit);
      return changes;
    } catch (error) {
      logger.error('SettingsRepository.getRecentChanges error:', error.message);
      throw error;
    }
  }
  async getCountByCategory() {
    try {
      const counts = await this.query()
        .select('category', db.raw('COUNT(*) as count'))
        .groupBy('category')
        .orderBy('category', 'asc');
      return counts;
    } catch (error) {
      logger.error('SettingsRepository.getCountByCategory error:', error.message);
      throw error;
    }
  }
  async exportAll() {
    try {
      const settings = await this.query()
        .orderBy('category', 'asc')
        .orderBy('setting_key', 'asc');
      return settings;
    } catch (error) {
      logger.error('SettingsRepository.exportAll error:', error.message);
      throw error;
    }
  }
  async importSettings(settings, updatedBy = null) {
    try {
      let imported = 0;
      for (const setting of settings) {
        const existing = await this.getByKey(setting.key);
        const value = typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value);
        if (existing) {
          await this.update(existing.id, {
            setting_value: value,
            category: setting.category || existing.category,
            description: setting.description || existing.description,
            updated_by: updatedBy,
            updated_at: db.fn.now()
          });
        } else {
          await this.create({
            setting_key: setting.key,
            setting_value: value,
            category: setting.category || 'General',
            description: setting.description || null,
            updated_by: updatedBy,
            updated_at: db.fn.now()
          });
        }
        imported++;
      }
      return imported;
    } catch (error) {
      logger.error('SettingsRepository.importSettings error:', error.message);
      throw error;
    }
  }
}
module.exports = SettingsRepository;
