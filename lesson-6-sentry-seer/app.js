// app.js - local test application
import * as Sentry from '@sentry/node';
import express from 'express';
import 'dotenv/config';

// Initialize Sentry with your DSN
Sentry.init({
  dsn: process.env.SENTRY_DSN
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

function getOrder(id) {
    // Simulate database lookup that sometimes returns null
    return Math.random() > 0.5 ? {
        items: [{ price: 10.99 }]
    } : null;
}

function getProduct(productId) {
    // Simulate product lookup that sometimes returns incomplete data
    return Math.random() > 0.5 ? {
        id: productId,
        name: 'Sample Product'
        // Note: missing 'inventory' property intentionally
    } : {
        id: productId,
        name: 'Sample Product',
        inventory: { quantity: 10 }
    };
}

// Simple routes that demonstrate common production errors

// GET /orders/:id - Demonstrates null pointer errors
app.get('/orders/:id', (req, res) => {
    const order = getOrder(req.params.id);

    // FIXED: Check if order is null before accessing .items
    if (!order) {
        return res.status(404).json({ 
            success: false, 
            error: 'Order not found',
            orderId: req.params.id 
        });
    }

    const amount = order.items.reduce((sum, item) => sum + item.price, 0);

    res.json({ success: true, orderId: req.params.id, amount });
});

// GET /inventory/:productId - Demonstrates undefined property access
app.get('/inventory/:productId', (req, res) => {
    const product = getProduct(req.params.productId);
    
    // BUG #2: product.inventory might be undefined
    const quantity = product.inventory.quantity;
    
    res.json({ productId: req.params.productId, quantity });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📊 Try these endpoints to generate Sentry errors:');
    console.log(`   GET http://localhost:${PORT}/orders/123`);
    console.log(`   GET http://localhost:${PORT}/inventory/456`);
});