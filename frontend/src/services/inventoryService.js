import apiClient from './apiClient';
const inventoryService = {
  getInventory: async (params) => {
    return await apiClient.get('/inventory/products', { params });
  },
  getProductById: async (id) => {
    return await apiClient.get(`/inventory/products/${id}`);
  },
  createProduct: async (data) => {
    return await apiClient.post('/inventory/products', data);
  },
  updateProduct: async (id, data) => {
    return await apiClient.put(`/inventory/products/${id}`, data);
  },
  deleteProduct: async (id) => {
    return await apiClient.delete(`/inventory/products/${id}`);
  },
  adjustStock: async (data) => {
    return await apiClient.post('/inventory/adjustments', data);
  },
  registerStock: async (productId, quantity, unitCost, reason) => {
    return await apiClient.post('/inventory/adjustments', {
      productId,
      quantityChange: quantity,
      reason: reason || 'Initial stock registration',
      referenceType: 'Adjustment',
    });
  },
  markDamaged: async (data) => {
    return await apiClient.post('/inventory/mark-damaged', data);
  },
  markLost: async (data) => {
    return await apiClient.post('/inventory/mark-lost', data);
  },
  getMovements: async (params) => {
    return await apiClient.get('/inventory/movements', { params });
  },
  getStatistics: async () => {
    return await apiClient.get('/inventory/statistics');
  },
  getLowStock: async () => {
    return await apiClient.get('/inventory/products/low-stock');
  },
  getExpiringProducts: async (days = 30) => {
    return await apiClient.get('/inventory/products/expiring', { params: { days } });
  },
  getCategories: async () => {
    return await apiClient.get('/inventory/categories');
  },
  getUnits: async () => {
    return await apiClient.get('/inventory/units');
  },
};
export default inventoryService;
