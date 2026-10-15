/**
 * Formats a numeric price into Indian Rupee (INR) currency format.
 * Converts DummyJSON USD-like prices into realistic INR values using an 80x multiplier.
 * e.g., 9.99 -> ₹799
 */
export const formatINR = (priceInUSD) => {
  if (priceInUSD === undefined || priceInUSD === null || isNaN(priceInUSD)) {
    return '₹0';
  }
  // Use a realistic multiplier of 80 to convert demo prices to INR
  const inrAmount = Math.round(Number(priceInUSD) * 80);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inrAmount);
};

/**
 * Returns raw numeric INR value for arithmetic computations
 */
export const toINRNumber = (priceInUSD) => {
  if (!priceInUSD || isNaN(priceInUSD)) return 0;
  return Math.round(Number(priceInUSD) * 80);
};

/**
 * Calculates original price before discount
 */
export const getOriginalPrice = (discountedPriceUSD, discountPercentage = 0) => {
  if (!discountPercentage || discountPercentage <= 0) return discountedPriceUSD;
  const original = Number(discountedPriceUSD) / (1 - Number(discountPercentage) / 100);
  return original;
};

/**
 * Calculate amount saved in INR
 */
export const getSavingsAmount = (discountedPriceUSD, discountPercentage = 0) => {
  if (!discountPercentage || discountPercentage <= 0) return 0;
  const original = getOriginalPrice(discountedPriceUSD, discountPercentage);
  const currentINR = toINRNumber(discountedPriceUSD);
  const originalINR = toINRNumber(original);
  return Math.max(0, originalINR - currentINR);
};

/**
 * Clean and truncate string
 */
export const truncateText = (str, maxLength = 60) => {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

/**
 * Format date string into human readable format (e.g. 15 Oct, 2026)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
