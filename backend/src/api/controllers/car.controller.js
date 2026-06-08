const carRepository = require('../../repositories/car.repository');
const CarModel = require('../../models/Car.model');
const { logger } = require('../../config/logger');

exports.getAllCarsPublic = async (req, res) => {
  try {
    const cars = await carRepository.findAll({ filters: { deleted_at: null } });
    res.status(200).json({
      status: 'success',
      data: cars.map(car => car.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching public cars:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch vehicles' });
  }
};

exports.getAllCarsManager = async (req, res) => {
  try {
    const cars = await carRepository.findAll({ filters: { deleted_at: null } });
    res.status(200).json({
      status: 'success',
      data: cars.map(car => car.toJSON())
    });
  } catch (error) {
    logger.error('Error fetching manager cars:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch vehicles' });
  }
};

exports.createCar = async (req, res) => {
  try {
    const carModel = CarModel.fromRequest(req.body);
    
    // Handle image uploads if any
    if (req.files) {
      if (req.files.image1) carModel.image1 = `/uploads/${req.files.image1[0].filename}`;
      if (req.files.image2) carModel.image2 = `/uploads/${req.files.image2[0].filename}`;
      if (req.files.image3) carModel.image3 = `/uploads/${req.files.image3[0].filename}`;
      if (req.files.image4) carModel.image4 = `/uploads/${req.files.image4[0].filename}`;
    }

    const validation = carModel.validate();
    if (!validation.isValid) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validation.errors });
    }

    const dataToInsert = {
      name: carModel.name,
      daily_rate: carModel.dailyRate,
      seats: carModel.seats,
      transmission: carModel.transmission,
      fuel_type: carModel.fuelType,
      car_type: carModel.carType,
      description: carModel.description,
      availability: carModel.availability,
      image1: carModel.image1,
      image2: carModel.image2,
      image3: carModel.image3,
      image4: carModel.image4
    };

    const newCar = await carRepository.createAndReturn(dataToInsert);
    res.status(201).json({ status: 'success', data: CarModel.fromDatabase(newCar).toJSON() });
  } catch (error) {
    logger.error('Error creating car:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create vehicle' });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCar = await carRepository.findById(id);
    if (!existingCar) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    const carModel = CarModel.fromRequest({ ...existingCar.toJSON(), ...req.body });

    // Handle image uploads if any
    if (req.files) {
      if (req.files.image1) carModel.image1 = `/uploads/${req.files.image1[0].filename}`;
      if (req.files.image2) carModel.image2 = `/uploads/${req.files.image2[0].filename}`;
      if (req.files.image3) carModel.image3 = `/uploads/${req.files.image3[0].filename}`;
      if (req.files.image4) carModel.image4 = `/uploads/${req.files.image4[0].filename}`;
    }

    const validation = carModel.validate();
    if (!validation.isValid) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validation.errors });
    }

    const dataToUpdate = {
      name: carModel.name,
      daily_rate: carModel.dailyRate,
      seats: carModel.seats,
      transmission: carModel.transmission,
      fuel_type: carModel.fuelType,
      car_type: carModel.carType,
      description: carModel.description,
      availability: carModel.availability,
      ...(carModel.image1 && { image1: carModel.image1 }),
      ...(carModel.image2 && { image2: carModel.image2 }),
      ...(carModel.image3 && { image3: carModel.image3 }),
      ...(carModel.image4 && { image4: carModel.image4 })
    };

    const updatedCar = await carRepository.updateAndReturn(id, dataToUpdate);
    res.status(200).json({ status: 'success', data: CarModel.fromDatabase(updatedCar).toJSON() });
  } catch (error) {
    logger.error('Error updating car:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update vehicle' });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCar = await carRepository.findById(id);
    if (!existingCar) {
      return res.status(404).json({ status: 'error', message: 'Vehicle not found' });
    }

    await carRepository.softDelete(id);
    res.status(200).json({ status: 'success', message: 'Vehicle deleted successfully' });
  } catch (error) {
    logger.error('Error deleting car:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete vehicle' });
  }
};
