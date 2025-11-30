/**
 * Calculate final price based on discount type
 * @param {number} price - Base price
 * @param {number} discount - Discount amount
 * @param {string} discountType - 'percent' or 'fixed'
 * @returns {number} Final price
 */
export const calculateFinalPrice = (price, discount, discountType) => {
  if (!price || price <= 0) return 0;
  if (!discount || discount <= 0) return price;

  if (discountType === 'percent') {
    return Math.max(0, price * (1 - discount / 100));
  } else if (discountType === 'fixed') {
    return Math.max(0, price - discount);
  }
  
  return price;
};










