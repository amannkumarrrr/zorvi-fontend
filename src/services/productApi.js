import axios from 'axios';

const BACKEND_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://zorvi-backend.vercel.app/api' : 'http://localhost:5001/api');
const DUMMY_API_URL = 'https://dummyjson.com';

const backendClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

backendClient.interceptors.request.use(
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

const dummyClient = axios.create({
  baseURL: DUMMY_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Clean, neutral SVG placeholder for broken/unloaded images
 */
export const NEUTRAL_FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill="%2394a3b8"/><path d="m21 15-5-5-6 6-3-3-4 4"/></svg>';

/**
 * Normalizes a product object ensuring exact DummyJSON fields are mapped consistently
 */
export const normalizeProduct = (item) => {
  if (!item) return null;

  // Actual API-provided product images and thumbnails
  const rawThumbnail = item.thumbnail || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '');
  const images = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : (rawThumbnail ? [rawThumbnail] : [NEUTRAL_FALLBACK_IMAGE]);

  const numericId = item.id !== undefined && !isNaN(item.id) ? Number(item.id) : null;

  return {
    ...item,
    id: numericId !== null ? numericId : (item._id || item.externalId),
    externalId: numericId !== null ? numericId : item.externalId,
    mongoId: item._id,
    title: item.title || 'Untitled Product',
    description: item.description || '',
    category: (item.category || 'general').toLowerCase(),
    brand: item.brand || 'ZORVI Curated',
    price: Number(item.price) || 0,
    discountPercentage: Number(item.discountPercentage) || 0,
    rating: Number(item.rating) || 4.5,
    stock: item.stock !== undefined ? Number(item.stock) : 50,
    isInStock: item.stock === undefined || Number(item.stock) > 0,
    thumbnail: rawThumbnail || NEUTRAL_FALLBACK_IMAGE,
    images,
    sku: item.sku || (numericId ? `DUMMY-${numericId}` : undefined),
    warrantyInformation: item.warrantyInformation || '1 Year Brand Warranty',
    shippingInformation: item.shippingInformation || 'Standard 2-4 Days Shipping',
    availabilityStatus: item.availabilityStatus || 'In Stock',
    reviews: item.reviews || [],
    source: 'dummyjson',
  };
};

export const productApi = {
  /**
   * Fetch all products from DummyJSON using limit=0 (194 total products)
   */
  async getAllProducts(limit = 0) {
    try {
      const response = await dummyClient.get('/products', {
        params: { limit: limit === 0 ? 0 : limit },
      });
      const rawProducts = response.data?.products || [];
      return {
        products: rawProducts.map(normalizeProduct),
        total: response.data?.total || rawProducts.length,
      };
    } catch (err) {
      console.warn('[productApi] Direct DummyJSON getAllProducts failed, checking backend fallback:', err.message);
      try {
        const res = await backendClient.get('/products', { params: { limit: 100, page: 1 } });
        const raw = res.data?.data?.products || [];
        return {
          products: raw.map(normalizeProduct),
          total: res.data?.data?.pagination?.total || raw.length,
        };
      } catch (backendErr) {
        throw new Error('Unable to retrieve product catalog from DummyJSON. Please check internet connectivity.');
      }
    }
  },

  /**
   * Fetch paginated products with optional search, category, and limit
   */
  async getProducts({ page = 1, limit = 20, skip, category, minPrice, maxPrice, sortBy, q } = {}) {
    const pageNum = page || 1;
    const computedSkip = skip !== undefined ? skip : (pageNum - 1) * limit;

    try {
      let endpoint = '/products';
      const params = { limit, skip: computedSkip };

      if (q && q.trim()) {
        endpoint = '/products/search';
        params.q = q.trim();
      } else if (category && category !== 'all') {
        endpoint = `/products/category/${encodeURIComponent(category)}`;
      }

      if (sortBy) {
        params.sortBy = sortBy;
      }

      const response = await dummyClient.get(endpoint, { params });
      let products = (response.data?.products || []).map(normalizeProduct);
      let total = response.data?.total || products.length;

      // Apply price range filtering if supplied
      if (minPrice !== undefined || maxPrice !== undefined) {
        products = products.filter((p) => {
          if (minPrice !== undefined && p.price < minPrice) return false;
          if (maxPrice !== undefined && p.price > maxPrice) return false;
          return true;
        });
      }

      return {
        products,
        total,
        skip: computedSkip,
        limit,
        pagination: {
          page: pageNum,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.warn('[productApi] DummyJSON getProducts failed, checking backend:', err.message);
      try {
        const res = await backendClient.get('/products', {
          params: { page: pageNum, limit, q, category, minPrice, maxPrice, sortBy },
        });
        const raw = res.data?.data?.products || [];
        const pagination = res.data?.data?.pagination || {};
        return {
          products: raw.map(normalizeProduct),
          total: pagination.total || raw.length,
          skip: computedSkip,
          limit,
          pagination,
        };
      } catch (backendErr) {
        throw new Error('Failed to retrieve products from DummyJSON. Please verify network connection.');
      }
    }
  },

  /**
   * Fetch a single product by numeric ID or MongoDB ObjectId
   */
  async getProductById(id) {
    if (!id) throw new Error('Product ID is required');

    // 1. Try fetching directly from DummyJSON if numeric ID
    const isNumeric = !isNaN(id) && !String(id).includes('-');
    if (isNumeric) {
      try {
        const response = await dummyClient.get(`/products/${id}`);
        if (response.data) {
          return normalizeProduct(response.data);
        }
      } catch (dummyErr) {
        console.warn(`[productApi] DummyJSON /products/${id} fetch failed, checking backend:`, dummyErr.message);
      }
    }

    // 2. Fetch from backend (for MongoDB ObjectIds or seeded records)
    try {
      const response = await backendClient.get(`/products/${id}`);
      const raw = response.data?.data?.product;
      if (raw) return normalizeProduct(raw);
    } catch (backendErr) {
      console.error(`[productApi] Backend getProductById(${id}) failed:`, backendErr.message);
    }

    throw new Error(`Product #${id} could not be retrieved from DummyJSON catalog.`);
  },

  /**
   * Fetch all product categories directly from DummyJSON
   */
  async getCategories() {
    try {
      const response = await dummyClient.get('/products/categories');
      const raw = response.data || [];
      return raw.map((cat) => {
        if (typeof cat === 'string') {
          return {
            slug: cat.toLowerCase(),
            name: cat.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          };
        }
        return {
          slug: cat.slug || cat.name.toLowerCase(),
          name: cat.name || cat.slug,
        };
      });
    } catch (err) {
      console.warn('[productApi] DummyJSON getCategories failed, checking backend:', err.message);
      try {
        const res = await backendClient.get('/categories');
        const raw = res.data?.data?.categories || [];
        return raw.map((cat) => ({
          slug: cat.slug,
          name: cat.name,
        }));
      } catch (backendErr) {
        throw new Error('Failed to load categories from DummyJSON.');
      }
    }
  },

  /**
   * Fetch products by category slug
   */
  async getProductsByCategory(category, { limit = 0 } = {}) {
    try {
      const response = await dummyClient.get(`/products/category/${encodeURIComponent(category)}`, {
        params: { limit: limit === 0 ? 0 : limit },
      });
      const raw = response.data?.products || [];
      return {
        products: raw.map(normalizeProduct),
        total: response.data?.total || raw.length,
      };
    } catch (err) {
      console.warn(`[productApi] DummyJSON getProductsByCategory(${category}) failed:`, err.message);
      const res = await backendClient.get(`/categories/${encodeURIComponent(category)}/products`, {
        params: { limit: limit || 50 },
      });
      const raw = res.data?.data?.products || [];
      return {
        products: raw.map(normalizeProduct),
        total: res.data?.data?.total || raw.length,
      };
    }
  },

  /**
   * Search products by keyword query
   */
  async searchProducts(query, { limit = 0 } = {}) {
    try {
      const response = await dummyClient.get('/products/search', {
        params: { q: query, limit: limit === 0 ? 0 : limit },
      });
      const raw = response.data?.products || [];
      return {
        products: raw.map(normalizeProduct),
        total: response.data?.total || raw.length,
      };
    } catch (err) {
      console.warn(`[productApi] DummyJSON searchProducts("${query}") failed:`, err.message);
      const res = await backendClient.get('/products', {
        params: { q: query, limit: limit || 50 },
      });
      const raw = res.data?.data?.products || [];
      return {
        products: raw.map(normalizeProduct),
        total: res.data?.data?.pagination?.total || raw.length,
      };
    }
  },

  /* ---------------- ADMIN ENDPOINTS (Preserved for MongoDB Admin Dashboard) ---------------- */

  async getAdminProducts({ page = 1, limit = 20, q, category } = {}) {
    const params = { page, limit };
    if (q) params.q = q;
    if (category && category !== 'all') params.category = category;
    const response = await backendClient.get('/admin/products', { params });
    return response.data;
  },

  async createProduct(productData) {
    const response = await backendClient.post('/admin/products', productData);
    return response.data;
  },

  async updateProduct(id, productData) {
    const response = await backendClient.patch(`/admin/products/${id}`, productData);
    return response.data;
  },

  async deleteProduct(id) {
    const response = await backendClient.delete(`/admin/products/${id}`);
    return response.data;
  },

  async createCategory(categoryData) {
    const response = await backendClient.post('/admin/categories', categoryData);
    return response.data;
  },

  /* ---------------- PRODUCT REVIEWS (MongoDB) ---------------- */

  async getProductReviews(productId) {
    try {
      const response = await backendClient.get(`/reviews/product/${productId}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to load MongoDB reviews:', error);
      return { success: false, data: { reviews: [], stats: { totalReviews: 0, averageRating: 0 } } };
    }
  },

  async submitReview(productId, reviewData) {
    try {
      const response = await backendClient.post(`/reviews/product/${productId}`, reviewData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit review');
    }
  },

  async deleteReview(reviewId) {
    try {
      const response = await backendClient.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete review');
    }
  },
};

export default productApi;
