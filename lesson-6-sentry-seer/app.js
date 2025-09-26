// app.js - Simple Express API for Sentry Seer production error fixing demo
import * as Sentry from '@sentry/node';
import express from 'express';
import 'dotenv/config';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'demo',
  tracesSampleRate: 1.0,
});

const app = express();
const PORT = 3000;

// Sentry request handler must be first
app.use(Sentry.Handlers.requestHandler());

// Simple routes that demonstrate common production errors

// GET /orders/:id - Demonstrates null pointer errors
app.get('/orders/:id', (req, res) => {
  const order = getOrder(req.params.id);

  // Check if order exists
  if (!order) {
    return res.status(404).json({ 
      error: 'Order not found',
      success: false,
      orderId: req.params.id
    });
  }

  // Check if order has items
  if (!order.items || order.items.length === 0) {
    return res.json({ 
      success: true, 
      orderId: req.params.id, 
      amount: 0,
      message: 'Order exists but contains no items'
    });
  }

  const amount = order.items.reduce((sum, item) => sum + item.price, 0);

  res.json({ success: true, orderId: req.params.id, amount });
});

// GET /inventory/:productId - Demonstrates undefined property access
app.get('/inventory/:productId', (req, res) => {
  const product = getProduct(req.params.productId);

  // Check if product exists at all
  if (!product) {
    return res.status(404).json({ 
      error: 'Product not found',
      available: false,
      quantity: 0
    });
  }

  // Check if inventory data is available
  if (!product.inventory) {
    return res.status(404).json({ 
      error: 'Inventory data not available for this product',
      available: false,
      quantity: 0
    });
  }

  const available = product.inventory.quantity > 0;

  res.json({ available, quantity: product.inventory.quantity });
});

// In-memory mock data
const mockProducts = {
  // Products with complete data
  '101': { id: '101', name: 'Gaming Laptop', inventory: { quantity: 5 } },
  '102': { id: '102', name: 'Wireless Mouse', inventory: { quantity: 0 } },
  '103': { id: '103', name: 'Keyboard', inventory: { quantity: 12 } },
  
  // Products missing inventory data (demonstrates original error)
  '201': { id: '201', name: 'Monitor' }, // No inventory property
  '202': { id: '202', name: 'Webcam' },  // No inventory property
  
  // Note: Products 301, 302, etc. are intentionally missing (demonstrates 404 scenarios)
};

const mockOrders = {
  // Orders with items
  '1001': { 
    id: '1001', 
    items: [
      { name: 'Widget', price: 10.99 },
      { name: 'Gadget', price: 15.49 }
    ]
  },
  '1002': { 
    id: '1002', 
    items: [
      { name: 'Premium Widget', price: 25.99 }
    ]
  },
  
  // Orders with no items (empty cart scenarios)
  '2001': { id: '2001', items: [] },
  '2002': { id: '2002', items: [] },
  
  // Note: Orders 3001, 3002, etc. are intentionally missing (demonstrates 404 scenarios)
};

// Mock database functions
function getOrder(id) {
  return mockOrders[id] || null;
}

function getProduct(id) {
  return mockProducts[id] || null;
}

// Sentry error handler must be after routes
app.use(Sentry.Handlers.errorHandler());

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📊 Try these endpoints to generate Sentry errors:');
  console.log(`   GET http://localhost:${PORT}/orders/123`);
  console.log(`   GET http://localhost:${PORT}/inventory/456`);
});
