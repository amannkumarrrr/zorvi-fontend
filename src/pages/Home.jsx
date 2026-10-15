import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Flame,
  ChevronRight,
  Eye,
} from 'lucide-react';
import productApi from '../services/productApi';
import ProductGrid from '../components/product/ProductGrid';
import ProductCard from '../components/product/ProductCard';
import { getFromStorage, STORAGE_KEYS } from '../utils/storage';

export const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Countdown timer for Deal of the Day
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 42,
    seconds: 15,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load products & categories in parallel
      const [allData, catData] = await Promise.all([
        productApi.getProducts({ limit: 24 }),
        productApi.getCategories(),
      ]);

      const items = allData.products || [];

      // Sort / filter for featured & popular
      const featured = items.slice(0, 8);
      const popular = [...items]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(8, 16);

      setFeaturedProducts(featured);
      setPopularProducts(popular);
      setCategories(catData || []);

      // Load recently viewed from storage
      const storedRecent = getFromStorage(STORAGE_KEYS.RECENTLY_VIEWED, []);
      setRecentlyViewed(storedRecent);
    } catch (err) {
      console.error('Home page load error:', err);
      setError(err.message || 'Unable to load catalog products. Please check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  // Visual Category Cards definition with images
  const categoryHighlights = [
    {
      name: 'Electronics & Laptops',
      slug: 'laptops',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      badge: 'Up to 30% Off',
    },
    {
      name: 'Smartphones & Tech',
      slug: 'smartphones',
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
      badge: 'Trending Now',
    },
    {
      name: 'Luxury Fragrances',
      slug: 'fragrances',
      image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
      badge: 'Exclusive',
    },
    {
      name: 'Beauty & Skincare',
      slug: 'beauty',
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      badge: 'Bestseller',
    },
    {
      name: 'Home Decoration',
      slug: 'home-decoration',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
      badge: 'New Arrivals',
    },
    {
      name: 'Modern Furniture',
      slug: 'furniture',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      badge: 'Premium Finish',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-8 pb-16 lg:py-24">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen E-Commerce Frontend Experience</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Discover Curated <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-400">
                  Luxury & Lifestyle
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Experience seamless browsing, live DummyJSON catalog integration, instant cart calculations, and responsive design crafted for modern shoppers.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/products"
                  className="w-full sm:w-auto px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 group active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop Full Catalog</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/products?category=laptops"
                  className="w-full sm:w-auto px-7 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2"
                >
                  Explore Tech Deals
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-center lg:text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">100+</p>
                  <p className="text-xs text-slate-400">Live Products</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">4.8 ★</p>
                  <p className="text-xs text-slate-400">Customer Rating</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-white">₹0 Fee</p>
                  <p className="text-xs text-slate-400">Orders &gt; ₹999</p>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-tr from-slate-900 to-slate-800 shadow-2xl p-4">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                    alt="Premium Wireless Headphones"
                    className="w-full h-80 sm:h-96 object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent rounded-2xl" />

                  {/* Floating Highlight Card */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                          Deal of the Season
                        </span>
                        <h4 className="text-sm font-bold mt-0.5">Premium Audio & Accessories</h4>
                      </div>
                      <Link
                        to="/products"
                        className="px-3.5 py-1.5 bg-teal-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-teal-300 transition"
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Floating Tag */}
                <div className="absolute -top-3 right-2 sm:-top-4 sm:-right-4 bg-white text-slate-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2 animate-bounce">
                  <Percent className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold">Up to 40% Off Deals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop By Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Browse Categories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Curated Collections
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categoryHighlights.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className="group relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300 p-3 flex flex-col justify-between"
            >
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">
                  {cat.badge}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Handpicked for You</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Arrivals
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
          >
            <span>Browse All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductGrid
          products={featuredProducts}
          loading={loading}
          error={error}
          onRetry={loadHomeData}
          skeletonCount={8}
        />
      </section>

      {/* 4. Promotional Banner (Deal of the Day) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-12 shadow-xl border border-teal-800/40">
          {/* Decorative glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold tracking-wide">
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>LIMITED TIME FLASH OFFER</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Save an Extra 10% on Everything
              </h3>

              <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                Use promo code <strong className="text-teal-300 font-bold underline">ZORVI10</strong> at checkout to claim your savings. Applicable on electronics, perfumes, and home living.
              </p>

              {/* Countdown Timer */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 mr-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Ends in:</span>
                </div>
                <div className="flex items-center gap-2 text-center">
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 min-w-[50px]">
                    <span className="block text-lg font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="block text-[9px] text-slate-400 uppercase">Hours</span>
                  </div>
                  <span className="text-slate-400 font-bold">:</span>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 min-w-[50px]">
                    <span className="block text-lg font-black text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="block text-[9px] text-slate-400 uppercase">Mins</span>
                  </div>
                  <span className="text-slate-400 font-bold">:</span>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 min-w-[50px]">
                    <span className="block text-lg font-black text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="block text-[9px] text-slate-400 uppercase">Secs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-start md:justify-end">
              <Link
                to="/products"
                className="px-8 py-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm rounded-2xl transition shadow-lg shadow-teal-500/20 text-center active:scale-95"
              >
                Claim Offer Now &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Best-Selling / Popular Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Top Rated Products
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductGrid
          products={popularProducts}
          loading={loading}
          error={error}
          onRetry={loadHomeData}
          skeletonCount={8}
        />
      </section>

      {/* 6. Recently Viewed Products (if any stored) */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="flex items-center gap-2 mb-6 text-slate-800">
            <Eye className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Recently Viewed Products
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {recentlyViewed.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
