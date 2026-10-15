import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { toINRNumber, getOriginalPrice } from '../utils/formatters';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import cartApi from '../services/cartApi';
import orderApi from '../services/orderApi';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { addToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Cart items state: purely for authenticated session (empty for guests)
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Synchronize cart with backend when user logs in or page loads
  const syncCartWithServer = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setAppliedCoupon(null);
      saveToStorage(STORAGE_KEYS.CART, []);
      return;
    }

    try {
      setSyncing(true);
      // Fetch authoritative cart from server
      const res = await cartApi.getCart();
      if (res && res.success && res.data?.items) {
        const serverItems = res.data.items.map((item) => ({
          id: item.product._id || item.product.id,
          _id: item.product._id,
          title: item.product.title,
          price: item.product.price,
          discountPercentage: item.product.discountPercentage || 0,
          thumbnail: item.product.thumbnail || item.product.images?.[0] || '',
          brand: item.product.brand || 'ZORVI Signature',
          category: item.product.category || 'General',
          stock: item.product.stock || 50,
          quantity: item.quantity,
        }));
        setCartItems(serverItems);
      }
    } catch (err) {
      console.warn('[CartContext] Cart sync error:', err.message);
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated]);

  // Clear cart on logout and sync on login
  useEffect(() => {
    if (!isAuthenticated) {
      setCartItems([]);
      setAppliedCoupon(null);
      saveToStorage(STORAGE_KEYS.CART, []);
    } else {
      syncCartWithServer();
    }
  }, [isAuthenticated, syncCartWithServer]);

  const addToCart = async (product, quantity = 1) => {
    if (!product || (!product.id && !product._id)) return { success: false };

    // Disallow guest carts completely
    if (!isAuthenticated) {
      return { success: false, requireAuth: true };
    }

    const productId = product._id || product.id;

    // 1. Optimistic Local State Update
    let newItems = [...cartItems];
    const existingIndex = newItems.findIndex((item) => item.id === productId || item._id === productId);

    if (existingIndex > -1) {
      const newQty = newItems[existingIndex].quantity + quantity;
      const maxStock = product.stock || 99;
      if (newQty > maxStock) {
        addToast(`Maximum stock limit reached (${maxStock} items)`, 'warning');
        return { success: false };
      }
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newQty,
      };
      addToast(`Updated quantity in cart (${newQty})`, 'success');
    } else {
      const itemToAdd = {
        id: productId,
        _id: product._id,
        title: product.title,
        price: product.price,
        discountPercentage: product.discountPercentage || 0,
        thumbnail: product.thumbnail || product.images?.[0] || '',
        brand: product.brand || 'ZORVI Signature',
        category: product.category || 'General',
        stock: product.stock || 50,
        quantity: Math.min(quantity, product.stock || 50),
      };
      newItems.push(itemToAdd);
      addToast(`Added "${product.title}" to cart`, 'success');
    }

    setCartItems(newItems);

    // 2. Sync with Backend
    try {
      await cartApi.addItem(productId, quantity);
      return { success: true };
    } catch (err) {
      console.warn('[CartContext] Server add item failed:', err.message);
      return { success: false, error: err.message };
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return;

    const itemToRemove = cartItems.find((item) => item.id === productId || item._id === productId);
    if (itemToRemove) {
      addToast(`Removed "${itemToRemove.title}" from cart`, 'info');
    }

    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId && item._id !== productId)
    );

    try {
      await cartApi.removeItem(productId);
    } catch (err) {
      console.warn('[CartContext] Server remove item failed:', err.message);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (!isAuthenticated) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === productId || item._id === productId) {
          const maxStock = item.stock || 99;
          const qty = Math.min(newQuantity, maxStock);
          return { ...item, quantity: qty };
        }
        return item;
      })
    );

    try {
      await cartApi.updateItem(productId, newQuantity);
    } catch (err) {
      console.warn('[CartContext] Server update item failed:', err.message);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    setAppliedCoupon(null);

    if (isAuthenticated) {
      try {
        await cartApi.clearCart();
      } catch (err) {
        console.warn('[CartContext] Server clear cart failed:', err.message);
      }
    }
  };

  // Calculations
  const calculations = useMemo(() => {
    let totalItems = 0;
    let subtotalINR = 0;
    let originalTotalINR = 0;

    cartItems.forEach((item) => {
      const qty = item.quantity;
      totalItems += qty;

      const unitPriceINR = toINRNumber(item.price);
      subtotalINR += unitPriceINR * qty;

      const unitOriginalUSD = getOriginalPrice(item.price, item.discountPercentage);
      const unitOriginalINR = toINRNumber(unitOriginalUSD);
      originalTotalINR += unitOriginalINR * qty;
    });

    const catalogDiscountINR = Math.max(0, originalTotalINR - subtotalINR);

    // Free delivery threshold: ₹999
    const freeDeliveryThreshold = 999;
    const deliveryFeeINR = subtotalINR === 0 ? 0 : subtotalINR >= freeDeliveryThreshold ? 0 : 99;

    let couponDiscountINR = 0;
    if (appliedCoupon && subtotalINR > 0) {
      if (typeof appliedCoupon.discountINR === 'number' && appliedCoupon.discountINR > 0) {
        couponDiscountINR = Math.min(appliedCoupon.discountINR, subtotalINR);
      } else if (appliedCoupon.discountType === 'percentage' || appliedCoupon.type === 'percentage') {
        const pct = appliedCoupon.discountValue || appliedCoupon.value || 10;
        couponDiscountINR = Math.round((subtotalINR * pct) / 100);
      } else {
        const flatVal = appliedCoupon.discountValue || appliedCoupon.value || 99;
        couponDiscountINR = Math.min(flatVal, subtotalINR);
      }
    }

    const finalTotalINR = Math.max(0, subtotalINR - couponDiscountINR + deliveryFeeINR);

    return {
      totalItems,
      subtotalINR,
      originalTotalINR,
      catalogDiscountINR,
      deliveryFeeINR,
      freeDeliveryThreshold,
      couponDiscountINR,
      finalTotalINR,
    };
  }, [cartItems, appliedCoupon]);

  const applyCoupon = async (code) => {
    const cleanCode = code?.trim().toUpperCase();
    if (!cleanCode) {
      addToast('Please enter a coupon code', 'warning');
      return { success: false, message: 'Please enter a coupon code' };
    }

    try {
      const res = await orderApi.validateCoupon(cleanCode, calculations.subtotalINR);
      if (res.success && res.coupon) {
        setAppliedCoupon({
          code: res.coupon.code,
          description: res.coupon.description,
          discountINR: res.coupon.discountINR,
          discountType: res.coupon.discountType,
          discountValue: res.coupon.discountValue,
        });
        addToast(`Coupon "${res.coupon.code}" applied! Saved ₹${res.coupon.discountINR}.`, 'success');
        return { success: true, coupon: res.coupon };
      }
    } catch (err) {
      addToast(err.message || 'Invalid coupon code', 'error');
      return { success: false, message: err.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast('Coupon removed', 'info');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        syncing,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        refreshCart: syncCartWithServer,
        ...calculations,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
