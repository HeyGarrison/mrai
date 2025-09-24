// cart.test.js
const { calculateCartTotal } = require('./cart.js');

describe('Cart Total Calculation', () => {
    test('calculates basic cart total correctly', () => {
        const items = [
            { price: 10.00, quantity: 2 },
            { price: 5.99, quantity: 1 }
        ];
        
        const result = calculateCartTotal(items, null, 'domestic');
        expect(result.subtotal).toBe(25.99);
        expect(result.total).toBeGreaterThan(25.99); // includes shipping
    });

    test('applies discount code correctly', () => {
        const items = [{ price: 100.00, quantity: 1 }];
        
        const result = calculateCartTotal(items, 'SAVE20', 'domestic');
        expect(result.subtotal).toBe(80.00); // 20% off
    });

    test('handles empty cart', () => {
        expect(() => calculateCartTotal([], null, 'domestic')).not.toThrow();
    });

    test('handles null items array', () => {
        // This test will fail due to the bug
        expect(() => calculateCartTotal(null, null, 'domestic')).not.toThrow();
    });

    test('handles invalid discount code', () => {
        const items = [{ price: 10.00, quantity: 1 }];
        
        // This test will fail due to the bug
        expect(() => calculateCartTotal(items, 'INVALID', 'domestic')).not.toThrow();
    });
});