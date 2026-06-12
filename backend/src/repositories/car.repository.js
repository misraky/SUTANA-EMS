const BaseRepository = require('./base.repository');
const CarModel = require('../models/Car.model');

class CarRepository extends BaseRepository {
  constructor() {
    super('cars');
  }

  async findAll(options = {}) {
    const result = await super.findAll({ ...options, orderBy: 'created_at', orderDirection: 'desc' });
    return result.map(car => CarModel.fromDatabase(car));
  }

  async findById(id) {
    const car = await super.findById(id);
    return car ? CarModel.fromDatabase(car) : null;
  }
}

module.exports = new CarRepository();
