import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
  LogOut,
  ShieldCheck,
  LogIn,
  Package,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import productApi from '../../services/productApi';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const categoryMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const handleCartClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      addToast('Please log in or create an account to access your cart.', 'warning');
      navigate('/login', {
        state: {
          from: { pathname: '/cart' },
          message: 'Please log in or create an account to access your cart.',
        },
      });
      setIsMobileMenuOpen(false);
    }
  };

  // Sync search input with URL search param if on products page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    } else if (location.pathname !== '/products') {
      setSearchQuery('');
    }
  }, [location]);

  // Load categories
  useEffect(() => {
    let mounted = true;
    productApi.getCategories().then((cats) => {
      if (mounted) {
        setCategories(cats || []);
      }
    }).catch(console.error);

    return () => {
      mounted = false;
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      setIsMobileMenuOpen(false);
    } else {
      navigate('/products');
    }
  };

  const curatedNavCategories = [
    { name: 'All Products', path: '/products' },
    { name: 'Beauty & Fragrances', path: '/products?category=beauty' },
    { name: 'Laptops & Tech', path: '/products?category=laptops' },
    { name: 'Smartphones', path: '/products?category=smartphones' },
    { name: 'Home & Decor', path: '/products?category=home-decoration' },
    { name: 'Furniture', path: '/products?category=furniture' },
    { name: 'Groceries', path: '/products?category=groceries' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* 1. Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 transition-colors border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <p className="font-medium tracking-tight">
              Summer Launch: <span className="text-teal-300 font-semibold">Free Express Shipping</span> on orders over ₹999!
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-400">
            <span>Use Coupon <strong className="text-teal-300">ZORVI10</strong> for 10% Off</span>
            <span className="text-slate-600">|</span>
            {isAdmin ? (
              <Link to="/admin" className="text-teal-300 font-semibold hover:underline flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </Link>
            ) : (
              <span className="text-slate-400">MongoDB Atlas Connected</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <nav className="glass-card bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-white border border-slate-200/80 flex items-center justify-center p-0.5 shadow-sm group-hover:shadow-teal-500/10 transition-all">
                <img src="/zorvi-logo.jpg" alt="ZORVI Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 font-sans flex items-center gap-1">
                  ZORVI
                  <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                </span>
                <span className="text-[9px] font-bold tracking-widest text-teal-700 uppercase -mt-1">
                  India's next big find
                </span>
              </div>
            </Link>

            {/* Product Search Bar (Desktop / Tablet) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden sm:flex flex-1 max-w-xl relative items-center"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products in MongoDB catalog..."
                  className="w-full pl-10 pr-24 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm rounded-full border border-slate-200/80 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-200 placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-full transition-colors duration-200 shadow-sm"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              
              {/* Authentication Status / Profile Menu */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-700"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden lg:block text-left leading-tight">
                      <span className="block text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                      <span className="block text-xs font-bold text-slate-800 truncate max-w-[100px]">
                        {user.name}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-fade-in text-xs">
                      <div className="p-3 border-b border-slate-100">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-teal-50 text-teal-700'
                        }`}>
                          {user.role === 'admin' ? 'Administrator' : 'Verified Customer'}
                        </span>
                      </div>

                      <div className="py-1">
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-teal-800 font-semibold hover:bg-teal-50 transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <Link
                          to="/orders"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          <span>My Wishlist ({totalWishlistItems})</span>
                        </Link>
                        <Link
                          to="/cart"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <span>My Cart ({totalItems})</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-full transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-600" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Wishlist Link */}
              <Link
                to="/wishlist"
                className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5 text-slate-700 hover:text-rose-500 transition-colors" />
                {totalWishlistItems > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {totalWishlistItems}
                  </span>
                )}
              </Link>

              {/* Cart Link */}
              <Link
                to="/cart"
                onClick={handleCartClick}
                className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5 text-slate-700 hover:text-teal-700 transition-colors" />
                {isAuthenticated && totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-teal-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors ml-1"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="sm:hidden pb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-20 py-2 bg-slate-100 text-slate-800 text-sm rounded-xl border border-slate-200 outline-none focus:border-teal-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-teal-600 text-white text-xs font-medium rounded-lg"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* 3. Sub-Navbar: Categories Ribbon */}
        <div className="hidden sm:block border-t border-slate-100 bg-slate-50/70 text-slate-700 text-xs font-medium">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* All Categories Dropdown Trigger */}
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center gap-2 py-2.5 px-3 hover:bg-slate-200/60 rounded-md font-semibold text-slate-800 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>All Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega / List Dropdown */}
              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 max-h-96 overflow-y-auto animate-fade-in">
                  <div className="p-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Product Categories ({categories.length})
                  </div>
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/products?category=${cat.slug}`}
                      onClick={() => setIsCategoryMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    >
                      <span>{cat.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
              {curatedNavCategories.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-white font-medium whitespace-nowrap transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right link */}
            <div className="hidden lg:flex items-center text-teal-700 font-semibold">
              <Link to="/products" className="hover:underline flex items-center gap-1">
                Explore Catalog &rarr;
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-up">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-0.5 shadow-sm">
                    <img src="/zorvi-logo.jpg" alt="ZORVI Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold text-slate-900 text-lg">ZORVI</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User mobile card */}
              <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      className="flex-1 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl text-center"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 py-2 bg-white border border-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Navigation
                </p>
                <div className="space-y-1">
                  <Link
                    to="/"
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-700"
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-700"
                  >
                    All Products
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-teal-800 bg-teal-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  {isAuthenticated && (
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-700"
                    >
                      <Package className="w-4 h-4 text-teal-600" />
                      <span>My Orders</span>
                    </Link>
                  )}
                  <Link
                    to="/wishlist"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-700"
                  >
                    <span>Wishlist</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-600 font-bold">
                      {totalWishlistItems}
                    </span>
                  </Link>
                  <Link
                    to="/cart"
                    onClick={handleCartClick}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-700"
                  >
                    <span>Shopping Cart</span>
                    {isAuthenticated && totalItems > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-700 font-bold">
                        {totalItems}
                      </span>
                    ) : null}
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Top Categories
                </p>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {categories.slice(0, 10).map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/products?category=${cat.slug}`}
                      className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-xs text-slate-500">
              <p className="font-semibold text-slate-800 mb-1">ZORVI E-Commerce Store</p>
              <p className="text-[11px] text-slate-400">Phase 2 Backend &amp; MongoDB Atlas Active</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
