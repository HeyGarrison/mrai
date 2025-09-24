// app.js - local test application
import * as Sentry from '@sentry/node';
import 'dotenv/config';

// Initialize Sentry with your DSN
Sentry.init({
  dsn: process.env.SENTRY_DSN
});

// Buggy function that will trigger Seer
function processPayment(orderId) {
    console.log(`Processing payment for order: ${orderId}`);

    const order = getOrder(orderId);

    // Bug: order could be null, but we don't check
    const amount = order.items.reduce((sum, item) => sum + item.price, 0);

    if (amount > 0) {
        return { success: true, amount };
    }

    throw new Error('Invalid payment amount');
}

function getOrder(id) {
    // Simulate database lookup that sometimes returns null
    return Math.random() > 0.5 ? {
        items: [{ price: 10.99 }]
    } : null;
}

// Trigger the error multiple times to ensure Sentry catches it
setInterval(() => {
    try {
        processPayment('test-order-' + Date.now());
    } catch (error) {
        console.error('Error caught:', error.message);
        Sentry.captureException(error);
    }
}, 3000);

console.log('App running - generating errors for Sentry Seer...');