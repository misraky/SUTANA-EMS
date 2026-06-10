class CarModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.dailyRate = data.daily_rate || data.dailyRate || 0;
    this.seats = data.seats || 4;
    this.transmission = data.transmission || 'Manual';
    this.fuelType = data.fuel_type || data.fuelType || 'Petrol';
    this.carType = data.car_type || data.carType || 'Sedan';
    this.description = data.description || '';
    this.availability = data.availability || 'Available';
    this.image1 = data.image1 || null;
    this.image2 = data.image2 || null;
    this.image3 = data.image3 || null;
    this.image4 = data.image4 || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
  }

  validate() {
    const errors = [];
    if (!this.name || this.name.length < 2 || this.name.length > 255) {
      errors.push('Car name must be between 2 and 255 characters');
    }
    if (this.dailyRate <= 0) {
      errors.push('Daily rate must be greater than 0');
    }
    if (this.seats < 1 || this.seats > 60) {
      errors.push('Seats must be a valid number between 1 and 60');
    }
    if (!['Manual', 'Automatic'].includes(this.transmission)) {
      errors.push('Transmission must be Manual or Automatic');
    }
    if (!['Petrol', 'Diesel', 'Hybrid'].includes(this.fuelType)) {
      errors.push('Fuel type must be Petrol, Diesel, or Hybrid');
    }
    if (!this.carType || this.carType.length < 1) {
      errors.push('Car type is required');
    }
    if (!['Available', 'Booked', 'Maintenance'].includes(this.availability)) {
      errors.push('Invalid availability status');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      dailyRate: this.dailyRate,
      seats: this.seats,
      transmission: this.transmission,
      fuelType: this.fuelType,
      carType: this.carType,
      description: this.description,
      availability: this.availability,
      image1: this.image1,
      image2: this.image2,
      image3: this.image3,
      image4: this.image4,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deleted_at: this.deletedAt
    };
  }

  static fromDatabase(data) {
    return new CarModel(data);
  }

  static fromRequest(data) {
    return new CarModel({
      name: data.name,
      dailyRate: data.dailyRate,
      seats: data.seats,
      transmission: data.transmission,
      fuelType: data.fuelType,
      carType: data.carType,
      description: data.description,
      availability: data.availability
    });
  }
}

module.exports = CarModel;
