import apiClient from './apiClient';

// NOTE: apiClient interceptor already returns response.data,
// so we get { status, data, ... } directly — no extra .data needed.

const pharmacyService = {
  // Dashboard
  getDashboardStats: async () => {
    return await apiClient.get('/pharmacy/dashboard');
  },

  // Categories
  getCategories: async () => {
    return await apiClient.get('/pharmacy/categories');
  },

  getCategoryById: async (id) => {
    return await apiClient.get(`/pharmacy/categories/${id}`);
  },

  createCategory: async (formData) => {
    return await apiClient.post('/pharmacy/categories', formData);
  },

  updateCategory: async (id, formData) => {
    return await apiClient.put(`/pharmacy/categories/${id}`, formData);
  },

  deleteCategory: async (id) => {
    return await apiClient.delete(`/pharmacy/categories/${id}`);
  },

  // Products
  getProducts: async () => {
    return await apiClient.get('/pharmacy/products');
  },

  searchProducts: async (query) => {
    return await apiClient.get(`/pharmacy/products/search?q=${encodeURIComponent(query)}`);
  },

  getProductsByCategory: async (categoryId) => {
    return await apiClient.get(`/pharmacy/products/category/${categoryId}`);
  },

  getProductById: async (id) => {
    return await apiClient.get(`/pharmacy/products/${id}`);
  },

  createProduct: async (formData) => {
    return await apiClient.post('/pharmacy/products', formData);
  },

  updateProduct: async (id, formData) => {
    return await apiClient.put(`/pharmacy/products/${id}`, formData);
  },

  deleteProduct: async (id) => {
    return await apiClient.delete(`/pharmacy/products/${id}`);
  },

  updateStock: async (id, data) => {
    return await apiClient.post(`/pharmacy/products/${id}/stock`, data);
  },

  // Branches
  getBranches: async () => {
    return await apiClient.get('/pharmacy/branches');
  },

  createBranch: async (formData) => {
    return await apiClient.post('/pharmacy/branches', formData);
  },

  updateBranch: async (id, formData) => {
    return await apiClient.put(`/pharmacy/branches/${id}`, formData);
  },

  deleteBranch: async (id) => {
    return await apiClient.delete(`/pharmacy/branches/${id}`);
  },

  // POS Sales
  createSale: async (data) => {
    return await apiClient.post('/pharmacy/pos/sales', data);
  },

  getSales: async () => {
    return await apiClient.get('/pharmacy/pos/sales');
  },
};

export default pharmacyService;
