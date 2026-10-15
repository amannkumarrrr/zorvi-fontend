import axios from 'axios';

const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aura_token');
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const cartApi = {
  /**
   * Fetch current authenticated user's cart
   */
  async getCart() {
    try {
      const response = await apiClient.get('/cart');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cart');
    }
  },

  /**
   * Add an item to user's cart
   */
  async addItem(productId, quantity = 1) {
    try {
      const response = await apiClient.post('/cart/items', { productId, quantity });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add item to cart');
    }
  },

  /**
   * Update item quantity in cart
   */
  async updateItem(productId, quantity) {
    try {
      const response = await apiClient.patch(`/cart/items/${productId}`, { quantity });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update item quantity');
    }
  },

  /**
   * Remove item from cart
   */
  async removeItem(productId) {
    try {
      const response = await apiClient.delete(`/cart/items/${productId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove item from cart');
    }
  },

  /**
   * Empty user's cart
   */
  async clearCart() {
    try {
      const response = await apiClient.delete('/cart');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to clear cart');
    }
  },

  /**
   * Merge guest cart items into user's persistent cart
   */
  async mergeCart(items) {
    try {
      const response = await apiClient.post('/cart/merge', { items });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to merge guest cart');
    }
  },
};

export default cartApi;
