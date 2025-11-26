import { describe, it, expect } from 'vitest';
import { calculateFinalPrice } from './calculations.js';

describe('calculateFinalPrice', () => {
  it('should return 0 for invalid or zero price', () => {
    expect(calculateFinalPrice(0, 10, 'percent')).toBe(0);
    expect(calculateFinalPrice(null, 10, 'percent')).toBe(0);
    expect(calculateFinalPrice(undefined, 10, 'percent')).toBe(0);
  });

  it('should return price when discount is 0 or invalid', () => {
    expect(calculateFinalPrice(100, 0, 'percent')).toBe(100);
    expect(calculateFinalPrice(100, null, 'percent')).toBe(100);
    expect(calculateFinalPrice(100, undefined, 'percent')).toBe(100);
  });

  it('should calculate percent discount correctly', () => {
    expect(calculateFinalPrice(100, 10, 'percent')).toBe(90);
    expect(calculateFinalPrice(100, 50, 'percent')).toBe(50);
    expect(calculateFinalPrice(100, 100, 'percent')).toBe(0);
  });

  it('should calculate fixed discount correctly', () => {
    expect(calculateFinalPrice(100, 10, 'fixed')).toBe(90);
    expect(calculateFinalPrice(100, 50, 'fixed')).toBe(50);
    expect(calculateFinalPrice(100, 100, 'fixed')).toBe(0);
  });

  it('should not return negative prices', () => {
    expect(calculateFinalPrice(100, 150, 'fixed')).toBe(0);
    expect(calculateFinalPrice(100, 200, 'percent')).toBe(0);
  });

  it('should handle decimal values correctly', () => {
    expect(calculateFinalPrice(99.99, 10, 'percent')).toBeCloseTo(89.991, 2);
    expect(calculateFinalPrice(100.50, 10.25, 'fixed')).toBeCloseTo(90.25, 2);
  });

  it('should return price when discountType is invalid', () => {
    expect(calculateFinalPrice(100, 10, 'invalid')).toBe(100);
  });
});



