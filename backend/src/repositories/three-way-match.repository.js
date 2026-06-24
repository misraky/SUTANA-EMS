const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');

class ThreeWayMatchRepository extends BaseRepository {
  constructor() {
    super('three_way_matches', 'id');
  }

  async getMatchWithDetails(matchId) {
    try {
      return await db('three_way_matches as twm')
        .leftJoin('purchase_orders as po', 'twm.po_id', 'po.id')
        .leftJoin('goods_receipt_notes as grn', 'twm.grn_id', 'grn.id')
        .leftJoin('expenses as e', 'twm.expense_id', 'e.id')
        .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
        .select(
          'twm.*',
          'po.po_number',
          's.name as supplier_name',
          'e.description as expense_description',
          'e.amount as expense_amount'
        )
        .where('twm.id', matchId)
        .first();
    } catch (error) {
      logger.error('ThreeWayMatchRepository.getMatchWithDetails error:', error.message);
      throw error;
    }
  }

  async getPendingMatches() {
    try {
      return await db('three_way_matches as twm')
        .leftJoin('purchase_orders as po', 'twm.po_id', 'po.id')
        .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
        .select('twm.*', 'po.po_number', 's.name as supplier_name')
        .whereIn('twm.match_status', ['pending', 'partial'])
        .orderBy('twm.created_at', 'asc');
    } catch (error) {
      logger.error('ThreeWayMatchRepository.getPendingMatches error:', error.message);
      throw error;
    }
  }

  async performMatch(matchId, userId) {
    try {
      const match = await this.findById(matchId);
      if (!match) throw new Error('Match record not found');
      const variance = Math.abs(match.po_amount - match.grn_amount - match.invoice_amount);
      const tolerance = match.po_amount * 0.05; // 5% tolerance
      const matchStatus = variance <= tolerance ? 'matched' : 'mismatch';
      await db('three_way_matches')
        .where('id', matchId)
        .update({
          match_status: matchStatus,
          variance_amount: variance,
          matched_by: userId,
          matched_at: db.fn.now(),
          updated_at: db.fn.now()
        });
      return { matchStatus, variance };
    } catch (error) {
      logger.error('ThreeWayMatchRepository.performMatch error:', error.message);
      throw error;
    }
  }
}

module.exports = ThreeWayMatchRepository;
