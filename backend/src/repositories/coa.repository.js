const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');

class ChartOfAccountsRepository extends BaseRepository {
  constructor() {
    super('chart_of_accounts', 'id');
  }

  async getAccountTree() {
    try {
      const all = await this.query()
        .where('is_active', true)
        .orderBy('account_code');
      const buildTree = (parentId = null) =>
        all.filter(a => a.parent_id === parentId).map(a => ({
          ...a,
          children: buildTree(a.id)
        }));
      return buildTree(null);
    } catch (error) {
      logger.error('COARepository.getAccountTree error:', error.message);
      throw error;
    }
  }

  async getByType(accountType) {
    try {
      return await this.query()
        .where('account_type', accountType)
        .where('is_active', true)
        .orderBy('account_code');
    } catch (error) {
      logger.error('COARepository.getByType error:', error.message);
      throw error;
    }
  }

  async getByCode(code) {
    try {
      return await this.findOne({ account_code: code });
    } catch (error) {
      logger.error('COARepository.getByCode error:', error.message);
      throw error;
    }
  }
}

module.exports = ChartOfAccountsRepository;
