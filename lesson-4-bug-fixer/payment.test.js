const { processPayment } = require('./payment.js');

test('processes valid payment', () => {
    const order = {
        items: [{ price: 10 }, { price: 20 }],
        customer: { card: '1234' }
    };
    const result = processPayment(order);
    expect(result.success).toBe(true);
});

test('handles missing items', () => {
    const order = {
        customer: { card: '1234' }
    };
    // This test will fail until we fix the bug
    expect(() => processPayment(order)).not.toThrow();
});