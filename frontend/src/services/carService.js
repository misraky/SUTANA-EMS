import api from './apiClient';

const carService = {
  // Public route to fetch all available cars
  getPublicCars: async () => {
    const response = await api.get('/cars/public');
    return response.data;
  },

  // Manager routes
  getAllCars: async () => {
    const response = await api.get('/cars');
    return response.data;
  },

  createCar: async (carData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    const response = await api.post('/cars', carData, config);
    return response.data;
  },

  updateCar: async (id, carData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    const response = await api.put(`/cars/${id}`, carData, config);
    return response.data;
  },

  deleteCar: async (id) => {
    const response = await api.delete(`/cars/${id}`);
    return response.data;
  }
};

export default carService;
