const { db } = require('../config/database');
const { logger } = require('../config/logger');
class BaseRepository {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }
  query() {
    return db(this.tableName);
  }
  async findById(id, columns = ['*']) {
    try {
      const result = await this.query()
        .select(columns)
        .where(this.primaryKey, id)
        .first();
      return result || null;
    } catch (error) {
      logger.error(`[${this.tableName}] findById error:`, error.message);
      throw error;
    }
  }
  async findOne(conditions, columns = ['*']) {
    try {
      const result = await this.query()
        .select(columns)
        .where(conditions)
        .first();
      return result || null;
    } catch (error) {
      logger.error(`[${this.tableName}] findOne error:`, error.message);
      throw error;
    }
  }
  async findAll(options = {}) {
    const {
      filters = {},
      columns = ['*'],
      orderBy = this.primaryKey,
      orderDirection = 'desc',
      limit = null,
      offset = null
    } = options;
    try {
      let query = this.query().select(columns).where(filters);
      if (orderBy) {
        query = query.orderBy(orderBy, orderDirection);
      }
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.offset(offset);
      }
      return await query;
    } catch (error) {
      logger.error(`[${this.tableName}] findAll error:`, error.message);
      throw error;
    }
  }
  async paginate(options = {}) {
    const {
      page = 1,
      limit = 25,
      filters = {},
      columns = ['*'],
      orderBy = this.primaryKey,
      orderDirection = 'desc'
    } = options;
    try {
      const offset = (page - 1) * limit;
      const countQuery = this.query().where(filters);
      const total = await countQuery.count(`${this.primaryKey} as count`).first();
      const data = await this.query()
        .select(columns)
        .where(filters)
        .orderBy(orderBy, orderDirection)
        .limit(limit)
        .offset(offset);
      return {
        data,
        pagination: {
          page,
          limit,
          total: parseInt(total?.count || 0),
          totalPages: Math.ceil((total?.count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error(`[${this.tableName}] paginate error:`, error.message);
      throw error;
    }
  }
  async create(data) {
    try {
      const [id] = await this.query().insert(data);
      return id;
    } catch (error) {
      logger.error(`[${this.tableName}] create error:`, error.message);
      throw error;
    }
  }
  async createAndReturn(data, columns = ['*']) {
    try {
      const [id] = await this.query().insert(data);
      return await this.findById(id, columns);
    } catch (error) {
      logger.error(`[${this.tableName}] createAndReturn error:`, error.message);
      throw error;
    }
  }
  async update(id, data) {
    try {
      const result = await this.query()
        .where(this.primaryKey, id)
        .update(data);
      return result;
    } catch (error) {
      logger.error(`[${this.tableName}] update error:`, error.message);
      throw error;
    }
  }
  async updateAndReturn(id, data, columns = ['*']) {
    try {
      await this.query()
        .where(this.primaryKey, id)
        .update(data);
      return await this.findById(id, columns);
    } catch (error) {
      logger.error(`[${this.tableName}] updateAndReturn error:`, error.message);
      throw error;
    }
  }
  async updateWhere(conditions, data) {
    try {
      const result = await this.query()
        .where(conditions)
        .update(data);
      return result;
    } catch (error) {
      logger.error(`[${this.tableName}] updateWhere error:`, error.message);
      throw error;
    }
  }
  async delete(id) {
    try {
      const result = await this.query()
        .where(this.primaryKey, id)
        .delete();
      return result;
    } catch (error) {
      logger.error(`[${this.tableName}] delete error:`, error.message);
      throw error;
    }
  }
  async softDelete(id) {
    try {
      const result = await this.query()
        .where(this.primaryKey, id)
        .update({ deleted_at: db.fn.now() });
      return result;
    } catch (error) {
      logger.error(`[${this.tableName}] softDelete error:`, error.message);
      throw error;
    }
  }
  async restore(id) {
    try {
      const result = await this.query()
        .where(this.primaryKey, id)
        .update({ deleted_at: null });
      return result;
    } catch (error) {
      logger.error(`[${this.tableName}] restore error:`, error.message);
      throw error;
    }
  }
  async exists(conditions) {
    try {
      const result = await this.query()
        .where(conditions)
        .first();
      return !!result;
    } catch (error) {
      logger.error(`[${this.tableName}] exists error:`, error.message);
      throw error;
    }
  }
  async count(conditions = {}) {
    try {
      const result = await this.query()
        .where(conditions)
        .count(`${this.primaryKey} as count`)
        .first();
      return parseInt(result?.count || 0);
    } catch (error) {
      logger.error(`[${this.tableName}] count error:`, error.message);
      throw error;
    }
  }
  async distinct(column, conditions = {}) {
    try {
      const results = await this.query()
        .where(conditions)
        .distinct(column);
      return results.map(r => r[column]);
    } catch (error) {
      logger.error(`[${this.tableName}] distinct error:`, error.message);
      throw error;
    }
  }
  async sum(column, conditions = {}) {
    try {
      const result = await this.query()
        .where(conditions)
        .sum(`${column} as total`)
        .first();
      return parseFloat(result?.total || 0);
    } catch (error) {
      logger.error(`[${this.tableName}] sum error:`, error.message);
      throw error;
    }
  }
  async avg(column, conditions = {}) {
    try {
      const result = await this.query()
        .where(conditions)
        .avg(`${column} as average`)
        .first();
      return parseFloat(result?.average || 0);
    } catch (error) {
      logger.error(`[${this.tableName}] avg error:`, error.message);
      throw error;
    }
  }
  async min(column, conditions = {}) {
    try {
      const result = await this.query()
        .where(conditions)
        .min(`${column} as min_value`)
        .first();
      return result?.min_value;
    } catch (error) {
      logger.error(`[${this.tableName}] min error:`, error.message);
      throw error;
    }
  }
  async max(column, conditions = {}) {
    try {
      const result = await this.query()
        .where(conditions)
        .max(`${column} as max_value`)
        .first();
      return result?.max_value;
    } catch (error) {
      logger.error(`[${this.tableName}] max error:`, error.message);
      throw error;
    }
  }
  async bulkInsert(records) {
    if (!records || records.length === 0) return 0;
    try {
      const result = await this.query().insert(records);
      return result.length;
    } catch (error) {
      logger.error(`[${this.tableName}] bulkInsert error:`, error.message);
      throw error;
    }
  }
  async bulkUpdate(updates) {
    if (!updates || updates.length === 0) return 0;
    try {
      let updated = 0;
      for (const update of updates) {
        const result = await this.update(update.id, update.data);
        updated += result;
      }
      return updated;
    } catch (error) {
      logger.error(`[${this.tableName}] bulkUpdate error:`, error.message);
      throw error;
    }
  }
  async getTransaction() {
    return await db.transaction();
  }
  async withTransaction(callback) {
    return await db.transaction(async (trx) => {
      const repoWithTrx = this.withTransactionObject(trx);
      return await callback(repoWithTrx);
    });
  }
  withTransactionObject(trx) {
    const repo = new BaseRepository(this.tableName, this.primaryKey);
    repo.query = () => db(this.tableName).transacting(trx);
    return repo;
  }
}
module.exports = BaseRepository;
