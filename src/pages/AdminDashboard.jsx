import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Layers,
  X,
  Loader2,
  RotateCcw,
  UploadCloud,
  Truck,
  Users,
  Eye,
  CheckCircle,
  Clock,
  IndianRupee,
  Calendar,
  AlertCircle,
  Tag,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import productApi from '../services/productApi';
import orderApi from '../services/orderApi';
import { toINRNumber } from '../utils/formatters';
import Breadcrumbs from '../components/common/Breadcrumbs';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'customers' | 'products'

  // Business Statistics State
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    cancelledOrders: 0,
    totalRevenueINR: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Product Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Orders Management State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Order Details Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [modalNextStatus, setModalNextStatus] = useState('');
  const [modalTrackingInfo, setModalTrackingInfo] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Customers Management State
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersTotalPages, setCustomersTotalPages] = useState(1);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Cloudinary upload state
  const [imageUploading, setImageUploading] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form State for Create/Edit Product
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'laptops',
    brand: 'ZORVI',
    price: 99.99,
    discountPercentage: 10,
    stock: 50,
    thumbnail: '',
    warrantyInformation: '1 Year Brand Warranty',
    shippingInformation: 'Standard 2-4 Days Shipping',
  });

  // Category Form State
  const [catFormData, setCatFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Guard: Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      addToast('Access denied: Administrator privileges required.', 'error');
      navigate('/login');
    }
  }, [isAdmin, authLoading, navigate, addToast]);

  const loadAdminStats = async () => {
    try {
      setStatsLoading(true);
      const res = await orderApi.getAdminStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAdminProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAdminProducts({
        page,
        limit: 15,
        q: searchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });

      if (data.success && data.data) {
        setProducts(data.data.products || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
      addToast('Failed to load admin inventory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await productApi.getCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdminOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await orderApi.getAdminOrders({
        page: ordersPage,
        limit: 15,
        status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
        paymentStatus: orderPaymentStatusFilter !== 'all' ? orderPaymentStatusFilter : undefined,
        q: orderSearchQuery.trim() || undefined,
      });

      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        setOrdersTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load customer orders', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadAdminCustomers = async () => {
    try {
      setCustomersLoading(true);
      const res = await orderApi.getAdminCustomers({
        page: customersPage,
        limit: 15,
        q: customerSearchQuery.trim() || undefined,
      });

      if (res.success && res.data) {
        setCustomers(res.data.customers || []);
        setCustomersTotalPages(res.data.pagination?.totalPages || 1);
        setCustomersTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load customer list', 'error');
    } finally {
      setCustomersLoading(false);
    }
  };

  // Initial & Tab-dependent data fetching
  useEffect(() => {
    if (isAdmin) {
      loadAdminStats();
      if (activeTab === 'orders') {
        loadAdminOrders();
      } else if (activeTab === 'customers') {
        loadAdminCustomers();
      } else if (activeTab === 'products') {
        loadAdminProducts();
        loadCategories();
      }
    }
  }, [
    isAdmin,
    activeTab,
    page,
    selectedCategory,
    ordersPage,
    orderStatusFilter,
    orderPaymentStatusFilter,
    customersPage,
  ]);

  const handleOrderSearch = (e) => {
    e.preventDefault();
    setOrdersPage(1);
    loadAdminOrders();
  };

  const handleCustomerSearch = (e) => {
    e.preventDefault();
    setCustomersPage(1);
    loadAdminCustomers();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadAdminProducts();
  };

  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      category: categories[0]?.slug || 'laptops',
      brand: 'ZORVI',
      price: 199.99,
      discountPercentage: 10,
      stock: 50,
      thumbnail: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80',
      warrantyInformation: '1 Year Brand Warranty',
      shippingInformation: 'Ships within 24 hours',
    });
    setEditingProduct(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      category: product.category,
      brand: product.brand || 'ZORVI',
      price: product.price,
      discountPercentage: product.discountPercentage || 0,
      stock: product.stock || 0,
      thumbnail: product.thumbnail,
      warrantyInformation: product.warrantyInformation || '1 Year Brand Warranty',
      shippingInformation: product.shippingInformation || 'Standard 2-4 Days Shipping',
    });
    setIsCreateModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const res = await orderApi.uploadImage(file, 'aura_products');
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
        addToast('Image uploaded successfully to Cloudinary!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Image upload failed', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);

    try {
      if (editingProduct) {
        const res = await productApi.updateProduct(editingProduct._id || editingProduct.id, formData);
        if (res.success) {
          addToast(`Product "${formData.title}" updated successfully!`, 'success');
          setIsCreateModalOpen(false);
          loadAdminProducts();
        }
      } else {
        const res = await productApi.createProduct(formData);
        if (res.success) {
          addToast(`New product "${formData.title}" added to MongoDB!`, 'success');
          setIsCreateModalOpen(false);
          loadAdminProducts();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Operation failed', 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (product) => {
    const isCurrentlyActive = product.isActive !== false;
    const actionLabel = isCurrentlyActive ? 'deactivate' : 'reactivate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} "${product.title}"?`)) {
      return;
    }

    try {
      if (isCurrentlyActive) {
        await productApi.deleteProduct(product._id || product.id);
        addToast(`Deactivated "${product.title}"`, 'info');
      } else {
        await productApi.updateProduct(product._id || product.id, { isActive: true });
        addToast(`Reactivated "${product.title}"`, 'success');
      }
      loadAdminProducts();
    } catch (err) {
      addToast('Failed to update product status.', 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);

    try {
      const res = await productApi.createCategory(catFormData);
      if (res.success) {
        addToast(`Category "${catFormData.name}" created!`, 'success');
        setIsCategoryModalOpen(false);
        setCatFormData({ name: '', slug: '', description: '' });
        loadCategories();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create category', 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, trackingInfo = '') => {
    try {
      setUpdatingOrderId(orderId);
      const res = await orderApi.updateOrderStatus(orderId, {
        orderStatus: newStatus,
        trackingInformation: trackingInfo,
      });

      if (res.success) {
        addToast(`Order marked as "${newStatus}"!`, 'success');
        loadAdminOrders();
        loadAdminStats();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Open Full Order Details Modal
  const handleOpenOrderDetails = async (orderId) => {
    try {
      setIsOrderModalOpen(true);
      setOrderDetailsLoading(true);
      const res = await orderApi.getAdminOrderDetails(orderId);
      if (res.success && res.data) {
        setSelectedOrderData(res.data);
        setModalNextStatus(res.data.allowedTransitions?.[0] || res.data.order?.orderStatus || '');
        setModalTrackingInfo(res.data.order?.trackingInformation || '');
      }
    } catch (err) {
      addToast(err.message || 'Failed to load order details', 'error');
      setIsOrderModalOpen(false);
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleModalStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderData?.order) return;

    try {
      setIsUpdatingStatus(true);
      const orderId = selectedOrderData.order._id;
      const res = await orderApi.updateOrderStatus(orderId, {
        orderStatus: modalNextStatus,
        trackingInformation: modalTrackingInfo,
      });

      if (res.success) {
        addToast(`Order status updated to "${modalNextStatus}"!`, 'success');
        // Refresh modal data
        const updated = await orderApi.getAdminOrderDetails(orderId);
        if (updated.success && updated.data) {
          setSelectedOrderData(updated.data);
          setModalNextStatus(updated.data.allowedTransitions?.[0] || updated.data.order?.orderStatus || '');
        }
        loadAdminOrders();
        loadAdminStats();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
            <Truck className="w-3 h-3" /> Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            <RotateCcw className="w-3 h-3" /> Processing
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            <X className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs
          items={[
            { label: 'Admin Portal', to: '/admin' },
            {
              label:
                activeTab === 'orders'
                  ? 'Orders & Tracking'
                  : activeTab === 'customers'
                  ? 'Customer Accounts'
                  : 'Product Inventory',
            },
          ]}
        />

        {/* Dashboard Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-200/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-0.5 shadow-md">
              <img src="/zorvi-logo.jpg" alt="ZORVI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                ZORVI <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">Admin Center</span>
              </h1>
              <p className="text-xs text-slate-500">
                Connected to MongoDB Atlas, Razorpay, Cloudinary &amp; Brevo SMTP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'products' && (
              <>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>New Category</span>
                </button>

                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Top Business Statistics Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Total Orders
              </span>
              <Package className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              {statsLoading ? '...' : stats.totalOrders}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All time orders</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Customers
              </span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              {statsLoading ? '...' : stats.totalUsers}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Registered accounts</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Pending
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-2xl font-black text-amber-600">
              {statsLoading ? '...' : stats.pendingOrders}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting confirmation</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Delivered
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-emerald-600">
              {statsLoading ? '...' : stats.completedOrders}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Fulfilled orders</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Total Revenue
              </span>
              <IndianRupee className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 truncate block">
              {statsLoading
                ? '...'
                : new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(stats.totalRevenueINR)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Paid &amp; delivered</span>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Orders &amp; Tracking</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
              activeTab === 'customers'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog ({totalCount})</span>
          </button>
        </div>

        {/* ---------------- TAB 1: CUSTOMER ORDERS ---------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <form onSubmit={handleOrderSearch} className="relative flex-1 w-full max-w-md">
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search order #, customer name, email..."
                  className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:border-teal-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => {
                      setOrderStatusFilter(e.target.value);
                      setOrdersPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none font-semibold text-slate-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Payment:</span>
                  <select
                    value={orderPaymentStatusFilter}
                    onChange={(e) => {
                      setOrderPaymentStatusFilter(e.target.value);
                      setOrdersPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none font-semibold text-slate-700"
                  >
                    <option value="all">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="Paid (Demo)">Paid (Demo)</option>
                  </select>
                </div>

                <button
                  onClick={loadAdminOrders}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Order #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                          <span>Loading customer orders...</span>
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No customer orders matching the criteria.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {order.orderNumber}
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-800">{order.shippingAddress?.fullName}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {order.shippingAddress?.email}
                            </p>
                          </td>

                          <td className="py-3 px-4 text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800">
                                {order.paymentMethod === 'demo_upi_qr'
                                  ? 'Demo UPI QR'
                                  : (order.paymentMethod || '').toUpperCase()}
                              </span>
                              {order.isDemoPayment && (
                                <span className="bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                                  Demo
                                </span>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                order.paymentStatus === 'Paid (Demo)' || order.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : order.paymentStatus === 'failed_demo' || order.paymentStatus === 'failed'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0,
                            }).format(order.totalAmountINR)}
                          </td>

                          <td className="py-3 px-4">{getOrderStatusBadge(order.orderStatus)}</td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenOrderDetails(order._id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold rounded-lg text-xs transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-600" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Orders Pagination */}
              {ordersTotalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {ordersPage} of {ordersTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={ordersPage <= 1}
                      onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-medium"
                    >
                      Previous
                    </button>
                    <button
                      disabled={ordersPage >= ordersTotalPages}
                      onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- TAB 2: CUSTOMERS & USERS ---------------- */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <form onSubmit={handleCustomerSearch} className="relative flex-1 w-full max-w-md">
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search customer by name or email..."
                  className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:border-teal-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg"
                >
                  Search
                </button>
              </form>

              <button
                onClick={loadAdminCustomers}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Customers</span>
              </button>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4">Orders Placed</th>
                      <th className="py-3.5 px-4">Lifetime Spend</th>
                      <th className="py-3.5 px-4">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                          <span>Loading customer accounts...</span>
                        </td>
                      </tr>
                    ) : customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No registered customer accounts found.
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="text-[11px] text-slate-400">{c.email}</p>
                            {c.phone && <p className="text-[10px] text-slate-400 mt-0.5">{c.phone}</p>}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.role === 'admin'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {c.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {new Date(c.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {c.orderCount || 0} orders
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0,
                            }).format(c.totalSpentINR || 0)}
                          </td>

                          <td className="py-3 px-4 text-slate-500">
                            {c.lastOrderDate
                              ? new Date(c.lastOrderDate).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'None'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Customers Pagination */}
              {customersTotalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {customersPage} of {customersTotalPages} ({customersTotal} total customers)
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={customersPage <= 1}
                      onClick={() => setCustomersPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-medium"
                    >
                      Previous
                    </button>
                    <button
                      disabled={customersPage >= customersTotalPages}
                      onClick={() => setCustomersPage((p) => Math.min(customersTotalPages, p + 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- TAB 3: PRODUCT CATALOG ---------------- */}
        {activeTab === 'products' && (
          <>
            {/* Search & Category Filter Controls */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search product title, brand, or SKU..."
                  className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:border-teal-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg"
                >
                  Search
                </button>
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-teal-500 font-medium text-slate-700 w-full sm:w-48"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price (INR)</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                          <span>Loading catalog from MongoDB Atlas...</span>
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No products found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const inrPrice = toINRNumber(product.price);
                        const isActive = product.isActive !== false;

                        return (
                          <tr
                            key={product._id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              !isActive ? 'bg-slate-50/50 opacity-60' : ''
                            }`}
                          >
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img
                                src={product.thumbnail || 'https://via.placeholder.com/48'}
                                alt={product.title}
                                className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                              />
                              <div className="truncate max-w-xs">
                                <p className="font-bold text-slate-900 truncate">{product.title}</p>
                                <p className="text-[11px] text-slate-400">
                                  {product.brand || 'ZORVI'} • {product.sku || 'No SKU'}
                                </p>
                              </div>
                            </td>

                            <td className="py-3 px-4 capitalize font-medium text-slate-600">
                              {product.category}
                            </td>

                            <td className="py-3 px-4 font-bold text-slate-900">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(inrPrice)}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                (${product.price})
                              </span>
                            </td>

                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {product.stock} units
                            </td>

                            <td className="py-3 px-4">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(product)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                                  title="Edit Product"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleDeactivate(product)}
                                  className={`p-1.5 rounded-lg transition ${
                                    isActive
                                      ? 'hover:bg-rose-50 text-rose-600'
                                      : 'hover:bg-emerald-50 text-emerald-600'
                                  }`}
                                  title={isActive ? 'Deactivate Product' : 'Reactivate Product'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Products Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-medium"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ---------------- ORDER DETAILS MODAL ---------------- */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {orderDetailsLoading || !selectedOrderData?.order ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
                <span>Loading complete order details...</span>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900">
                        {selectedOrderData.order.orderNumber}
                      </span>
                      {getOrderStatusBadge(selectedOrderData.order.orderStatus)}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Placed on{' '}
                      {new Date(selectedOrderData.order.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsOrderModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Customer & Shipping Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded-2xl text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                      Customer Info
                    </h5>
                    <p className="font-semibold text-slate-900">
                      {selectedOrderData.order.shippingAddress?.fullName}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedOrderData.order.shippingAddress?.email}
                    </p>
                    {selectedOrderData.order.shippingAddress?.phone && (
                      <p className="text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedOrderData.order.shippingAddress?.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                      Shipping Address
                    </h5>
                    <p className="text-slate-700 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {selectedOrderData.order.shippingAddress?.address},{' '}
                        {selectedOrderData.order.shippingAddress?.city},{' '}
                        {selectedOrderData.order.shippingAddress?.state} -{' '}
                        {selectedOrderData.order.shippingAddress?.pincode}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="mb-4">
                  <h5 className="font-bold text-slate-800 text-xs mb-2">Ordered Products</h5>
                  <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                    {selectedOrderData.order.items?.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageSnapshot || 'https://via.placeholder.com/40'}
                            alt={item.titleSnapshot}
                            className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{item.titleSnapshot}</p>
                            <p className="text-[11px] text-slate-400">
                              Qty: {item.quantity} ×{' '}
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(item.unitPriceINR)}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(item.lineTotalINR)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(selectedOrderData.order.subtotalINR)}
                      </span>
                    </div>
                    {selectedOrderData.order.discountINR > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>
                          Coupon Discount{' '}
                          {selectedOrderData.order.couponCode ? `(${selectedOrderData.order.couponCode})` : ''}:
                        </span>
                        <span>
                          -
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(selectedOrderData.order.discountINR)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Amount:</span>
                      <span>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(selectedOrderData.order.totalAmountINR)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Transition Control (State Machine Governed) */}
                <div className="mb-6 p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
                  <h5 className="font-bold text-teal-900 text-xs mb-1">Update Order Status</h5>
                  <p className="text-[11px] text-teal-700 mb-3">
                    Valid status transitions from current status "
                    <strong className="capitalize">{selectedOrderData.order.orderStatus}</strong>":
                  </p>

                  {selectedOrderData.allowedTransitions?.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">
                      This order has reached a terminal status ({selectedOrderData.order.orderStatus}). No
                      further transitions are allowed.
                    </div>
                  ) : (
                    <form onSubmit={handleModalStatusSubmit} className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedOrderData.allowedTransitions.map((statusOption) => (
                          <button
                            type="button"
                            key={statusOption}
                            onClick={() => setModalNextStatus(statusOption)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                              modalNextStatus === statusOption
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-white border border-teal-200 text-teal-800 hover:bg-teal-100/50'
                            }`}
                          >
                            Mark as {statusOption}
                          </button>
                        ))}
                      </div>

                      {modalNextStatus === 'shipped' && (
                        <div>
                          <label className="block text-[11px] font-bold text-teal-900 mb-1">
                            Courier &amp; Tracking Information:
                          </label>
                          <input
                            type="text"
                            value={modalTrackingInfo}
                            onChange={(e) => setModalTrackingInfo(e.target.value)}
                            placeholder="e.g. BlueDart - BD99201923"
                            className="w-full bg-white border border-teal-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-teal-600 text-slate-800"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isUpdatingStatus || !modalNextStatus}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>Confirm Transition to "{modalNextStatus}"</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Customer Purchase History */}
                <div>
                  <h5 className="font-bold text-slate-800 text-xs mb-2">Customer Order History</h5>
                  {!selectedOrderData.customerHistory || selectedOrderData.customerHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No other past orders on record for this customer.
                    </p>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {selectedOrderData.customerHistory.map((past) => (
                        <div key={past._id} className="p-2.5 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <span className="font-mono font-bold text-slate-800">{past.orderNumber}</span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {new Date(past.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(past.totalAmountINR)}
                            </span>
                            {getOrderStatusBadge(past.orderStatus)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Product Creation / Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Product (Cloudinary & MongoDB)'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. ZORVI Pro Wireless Earbuds"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500 capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Brand name"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPercentage: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stock Units *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Cloudinary Image Upload Section */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Thumbnail Image
                  </label>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    Cloudinary Supported
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://res.cloudinary.com/..."
                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500 text-xs"
                  />

                  <label className="px-3 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-xl cursor-pointer transition flex items-center gap-1.5 shrink-0 font-semibold">
                    {imageUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageFileChange}
                      disabled={imageUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.thumbnail && (
                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      className="w-12 h-12 object-contain rounded-lg bg-white border border-slate-200 p-1"
                    />
                    <span className="text-[11px] text-emerald-600 font-medium">Image preview loaded</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product description..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || imageUploading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  {modalSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create New Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catFormData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    setCatFormData({ ...catFormData, name, slug });
                  }}
                  placeholder="e.g. Smart Watches"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category Slug *
                </label>
                <input
                  type="text"
                  required
                  value={catFormData.slug}
                  onChange={(e) => setCatFormData({ ...catFormData, slug: e.target.value })}
                  placeholder="smart-watches"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="Category description..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {modalSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
