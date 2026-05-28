import apiClient from './apiClient';
const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.status === 'success') {
      const { token, refreshToken, sessionId, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken || '');
      if (sessionId) localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    throw new Error(response.message || 'Login failed');
  },
  register: async (userData) => {
    return await apiClient.post('/auth/register', userData);
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user?.roles?.includes(role) || user?.roles?.includes('Admin');
  },
  hasPermission: (permission) => {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permission);
  },
  requestPasswordReset: async (email) => {
    return await apiClient.post('/auth/reset-password/request', { email });
  },
  confirmPasswordReset: async (data) => {
    return await apiClient.post('/auth/reset-password/confirm', data);
  },
  verifyTwoFactor: async (code) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: 'success', data: { verified: true } });
      }, 1000);
    });
  }
};
export default authService;
