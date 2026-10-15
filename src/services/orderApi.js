import axios from 'axios';

const BACKEND_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://zorvi-backend.vercel.app/api' : 'http://localhost:5001/api');

const apiClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: true,
  timeout: 15000,
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

export const orderApi = {
  /**
   * Create COD or Razorpay order
   */
  async createOrder({ shippingAddress, paymentMethod, couponCode }) {
    try {
      const response = await apiClient.post('/payments/create-order', {
        shippingAddress,
        paymentMethod,
        couponCode,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to place order';
      const err = new Error(msg);
      err.errors = error.response?.data?.errors;
      err.qrUnavailable = error.response?.data?.qrUnavailable;
      err.errorCode = error.response?.data?.errorCode;
      throw err;
    }
  },

  /**
   * Verify Razorpay cryptographic payment signature
   */
  async verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    try {
      const response = await apiClient.post('/payments/verify', {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
  },

  /**
   * Check UPI QR payment status with backend/Razorpay
   */
  async checkQrStatus(orderId) {
    try {
      const response = await apiClient.get(`/payments/qr-status/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check QR payment status');
    }
  },

  /**
   * Cancel pending UPI QR payment, preserving customer cart
   */
  async cancelQrPayment(orderId) {
    try {
      const response = await apiClient.post(`/payments/cancel-payment/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel payment');
    }
  },

  /**
   * College Demo: Simulate successful payment
   */
  async simulateDemoSuccess(orderId) {
    try {
      const response = await apiClient.post(`/payments/demo-simulate-success/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to simulate payment success');
    }
  },

  /**
   * College Demo: Simulate payment failure
   */
  async simulateDemoFailure(orderId) {
    try {
      const response = await apiClient.post(`/payments/demo-simulate-failure/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to simulate payment failure');
    }
  },

  /**
   * Fetch customer order history
   */
  async getMyOrders() {
    try {
      const response = await apiClient.get('/orders/my-orders');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order history');
    }
  },

  /**
   * Fetch details for a specific order
   */
  async getOrderById(orderId) {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Order not found');
    }
  },

  /**
   * Cancel an eligible order
   */
  async cancelOrder(orderId) {
    try {
      const response = await apiClient.post(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel order');
    }
  },

  /* ---------------- ADMIN ENDPOINTS ---------------- */

  /**
   * Admin: Fetch dashboard business statistics
   */
  async getAdminStats() {
    try {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin statistics');
    }
  },

  /**
   * Admin: Fetch customers list with spend & order counts
   */
  async getAdminCustomers({ page = 1, limit = 15, q } = {}) {
    try {
      const params = { page, limit };
      if (q) params.q = q;
      const response = await apiClient.get('/admin/customers', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch customer accounts');
    }
  },

  /**
   * Admin: Fetch single order details with customer order history
   */
  async getAdminOrderDetails(orderId) {
    try {
      const response = await apiClient.get(`/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order details');
    }
  },

  /**
   * Admin: List all orders with filters
   */
  async getAdminOrders({ page = 1, limit = 20, status, paymentStatus, q } = {}) {
    try {
      const params = { page, limit };
      if (status && status !== 'all') params.status = status;
      if (paymentStatus && paymentStatus !== 'all') params.paymentStatus = paymentStatus;
      if (q) params.q = q;

      const response = await apiClient.get('/admin/orders', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin orders');
    }
  },

  /**
   * Admin: Update order status & tracking info
   */
  async updateOrderStatus(orderId, { orderStatus, trackingInformation }) {
    try {
      const response = await apiClient.patch(`/admin/orders/${orderId}/status`, {
        orderStatus,
        trackingInformation,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update order status');
    }
  },

  /**
   * Admin: Upload product image to Cloudinary
   */
  async uploadImage(file, folder = 'aura_products') {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);

      const response = await apiClient.post('/admin/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Image upload to Cloudinary failed');
    }
  },
  /**
   * Authoritatively validate coupon code
   */
  async validateCoupon(couponCode, subtotalINR) {
    try {
      const response = await apiClient.post('/payments/validate-coupon', {
        couponCode,
        subtotalINR,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to validate coupon');
    }
  },
};

export default orderApi;
