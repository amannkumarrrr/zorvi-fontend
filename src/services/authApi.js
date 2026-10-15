import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables sending and receiving HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token from localStorage to Authorization header
authClient.interceptors.request.use(
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

export const authApi = {
  /**
   * Register a new user account
   */
  async register(data) {
    try {
      const response = await authClient.post('/auth/register', data);
      if (response.data?.data?.token) {
        localStorage.setItem('aura_token', response.data.data.token);
        if (response.data.data.user) {
          localStorage.setItem('aura_user', JSON.stringify(response.data.data.user));
        }
      }
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK' ? 'Network error: Cannot reach ZORVI API server. Please check your connection.' : error.message) ||
        'Registration failed.';
      const errors = error.response?.data?.errors || [];
      const err = new Error(message);
      err.errors = errors;
      throw err;
    }
  },

  /**
   * Login with email and password
   */
  async login(data) {
    try {
      const response = await authClient.post('/auth/login', data);
      if (response.data?.data?.token) {
        localStorage.setItem('aura_token', response.data.data.token);
        if (response.data.data.user) {
          localStorage.setItem('aura_user', JSON.stringify(response.data.data.user));
        }
      }
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK' ? 'Network error: Cannot reach ZORVI API server. Please check your connection.' : error.message) ||
        'Invalid email or password.';
      const errors = error.response?.data?.errors || [];
      const err = new Error(message);
      err.errors = errors;
      throw err;
    }
  },

  /**
   * Logout current user and clear cookie
   */
  async logout() {
    try {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
      const response = await authClient.post('/auth/logout');
      return response.data;
    } catch (error) {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
      console.warn('Logout API error:', error);
      return { success: true };
    }
  },

  /**
   * Get current authenticated user session
   */
  async getMe() {
    try {
      const response = await authClient.get('/auth/me');
      return response.data;
    } catch (error) {
      // Return null quietly if not logged in
      return null;
    }
  },

  /**
   * Get authenticated user profile
   */
  async getProfile() {
    try {
      const response = await authClient.get('/users/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  },

  /**
   * Update authenticated user profile
   */
  async updateProfile(updates) {
    try {
      const response = await authClient.patch('/users/profile', updates);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  /**
   * Request a 6-digit OTP for password reset via Resend
   */
  async forgotPassword(email) {
    try {
      const response = await authClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK' ? 'Network error: Cannot reach ZORVI API server. Please check your connection.' : error.message) ||
        'Failed to send verification code.';
      const err = new Error(message);
      err.response = error.response;
      err.status = error.response?.status;
      err.remainingSeconds = error.response?.data?.remainingSeconds;
      err.hint = error.response?.data?.hint;
      throw err;
    }
  },

  /**
   * Verify the 6-digit OTP code to obtain a single-use reset authorization token
   */
  async verifyResetOtp(email, otp) {
    try {
      const response = await authClient.post('/auth/verify-reset-otp', { email, otp });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK' ? 'Network error: Cannot reach ZORVI API server. Please check your connection.' : error.message) ||
        'Failed to verify code.';
      const err = new Error(message);
      err.response = error.response;
      err.attemptsRemaining = error.response?.data?.attemptsRemaining;
      throw err;
    }
  },

  /**
   * Complete password reset using single-use authorization token
   */
  async resetPassword(email, resetToken, newPassword) {
    try {
      const response = await authClient.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword,
      });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK' ? 'Network error: Cannot reach ZORVI API server. Please check your connection.' : error.message) ||
        'Failed to reset password.';
      const err = new Error(message);
      err.response = error.response;
      throw err;
    }
  },

  /**
   * Request a 6-digit OTP for signup verification via Resend (Step 1)
   */
  async sendSignupOtp(email) {
    try {
      const response = await authClient.post('/auth/signup-otp', { email });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK' ? 'Network error: Cannot reach ZORVI API server. Please check your connection.' : error.message) ||
        'Failed to send signup verification code.';
      const err = new Error(message);
      err.response = error.response;
      err.remainingSeconds = error.response?.data?.remainingSeconds;
      err.status = error.response?.status;
      throw err;
    }
  },

  /**
   * Verify the 6-digit OTP for signup to obtain single-use signupToken (Step 2)
   */
  async verifySignupOtp(email, otp) {
    try {
      const response = await authClient.post('/auth/verify-signup-otp', { email, otp });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK' ? 'Network error: Cannot reach ZORVI API server. Please check your connection.' : error.message) ||
        'Failed to verify signup code.';
      const err = new Error(message);
      err.response = error.response;
      err.attemptsRemaining = error.response?.data?.attemptsRemaining;
      err.status = error.response?.status;
      throw err;
    }
  },
};

export default authApi;

