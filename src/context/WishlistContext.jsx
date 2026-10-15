import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { addToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState(() => {
    return getFromStorage(STORAGE_KEYS.WISHLIST, []);
  });

  // Sync with LocalStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.WISHLIST, wishlistItems);
  }, [wishlistItems]);

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  const toggleWishlist = (product) => {
    if (!product || !product.id) return;

    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        addToast(`Removed "${product.title}" from Wishlist`, 'info');
        return prev.filter((item) => item.id !== product.id);
      } else {
        addToast(`Saved "${product.title}" to Wishlist`, 'success');
        const itemToSave = {
          id: product.id,
          title: product.title,
          price: product.price,
          discountPercentage: product.discountPercentage || 0,
          thumbnail: product.thumbnail || product.images?.[0] || '',
          brand: product.brand || 'ZORVI Signature',
          category: product.category || 'General',
          rating: product.rating || 4.5,
          stock: product.stock || 50,
        };
        return [...prev, itemToSave];
      }
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => {
      const item = prev.find((i) => i.id === productId);
      if (item) {
        addToast(`Removed "${item.title}" from Wishlist`, 'info');
      }
      return prev.filter((i) => i.id !== productId);
    });
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    addToast('Wishlist cleared', 'info');
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        totalWishlistItems: wishlistItems.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
