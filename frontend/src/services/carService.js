import api from './apiClient';

const carService = {
  // Public route to fetch all available cars
  getPublicCars: async () => {
    const response = await api.get('/cars/public');
    return response;
  },

  // Manager routes
  getAllCars: async () => {
    const response = await api.get('/cars');
    return response;
  },

  createCar: async (carData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    const response = await api.post('/cars', carData, config);
    return response;
  },

  updateCar: async (id, carData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    const response = await api.put(`/cars/${id}`, carData, config);
    return response;
  },

  deleteCar: async (id) => {
    const response = await api.delete(`/cars/${id}`);
    return response;
  },

  restoreCar: async (id) => {
    const response = await api.patch(`/cars/${id}/restore`);
    return response;
  },

  hardDeleteCar: async (id) => {
    const response = await api.delete(`/cars/${id}/permanent`);
    return response;
  },

  // Mock Notification routes (using localStorage for frontend-only testing)
  submitNotifyRequest: async (data) => {
    return new Promise((resolve) => {
      const requests = JSON.parse(localStorage.getItem('car_notify_requests') || '[]');
      const newRequest = {
        ...data,
        id: 'REQ-' + Date.now(),
        timestamp: new Date().toISOString(),
        status: 'Pending'
      };
      requests.push(newRequest);
      localStorage.setItem('car_notify_requests', JSON.stringify(requests));
      setTimeout(() => resolve({ status: 'success', data: newRequest }), 300);
    });
  },

  getNotifyRequests: async () => {
    return new Promise((resolve) => {
      const requests = JSON.parse(localStorage.getItem('car_notify_requests') || '[]');
      // Only return pending requests, sorted by newest first
      const pending = requests.filter(req => req.status === 'Pending')
                              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setTimeout(() => resolve({ status: 'success', data: pending }), 300);
    });
  },

  markNotifyRequestProcessed: async (id) => {
    return new Promise((resolve) => {
      const requests = JSON.parse(localStorage.getItem('car_notify_requests') || '[]');
      const updated = requests.map(req => 
        req.id === id ? { ...req, status: 'Processed' } : req
      );
      localStorage.setItem('car_notify_requests', JSON.stringify(updated));
      setTimeout(() => resolve({ status: 'success' }), 300);
    });
  },

  // Rental Order routes
  createRentalOrder: async (orderData) => {
    const response = await api.post('/rental-orders', orderData);
    return response;
  },

  getMyRentalOrders: async () => {
    const response = await api.get('/rental-orders/my-orders');
    return response;
  },

  getAllRentalOrders: async () => {
    const response = await api.get('/rental-orders');
    return response;
  },

  updateRentalOrderStatus: async (id, data) => {
    const res = await api.patch(`/rental-orders/${id}/status`, data);
    return res.data;
  },

  // Lifecycle Methods
  cancelRentalOrder: async (id, reason) => {
    const res = await api.post(`/rental-orders/${id}/cancel`, { reason });
    return res.data;
  },

  approveCancellation: async (id, isApproved) => {
    const res = await api.post(`/rental-orders/${id}/cancel/approve`, { isApproved });
    return res.data;
  },

  extendRentalOrder: async (id, days) => {
    const res = await api.post(`/rental-orders/${id}/extend`, { days });
    return res.data;
  },

  approveExtension: async (id, data) => {
    // data: { isApproved, days }
    const res = await api.post(`/rental-orders/${id}/extend/approve`, data);
    return res.data;
  },

  processReturn: async (id, data) => {
    // data: { damageFee, fuelFee, lateFee, odometer, notes }
    const res = await api.post(`/rental-orders/${id}/process-return`, data);
    return res.data;
  },

  async uploadPaymentProof(id, formData) {
    const response = await api.post(`/rental-orders/${id}/payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  markNoShow: async (id) => {
    const res = await api.post(`/rental-orders/${id}/no-show`);
    return res.data;
  },

  updatePickupRemarks: async (id, remarks) => {
    const res = await api.patch(`/rental-orders/${id}/pickup-remarks`, { remarks });
    return res.data;
  }
};

export default carService;
