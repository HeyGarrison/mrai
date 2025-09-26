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

  const amount = order.items.reduce((sum, item) => sum + item.price, 0);

  res.json({ success: true, orderId: req.params.id, amount });
});

// GET /inventory/:productId - Demonstrates undefined property access
app.get('/inventory/:productId', (req, res) => {
  const product = getProduct(req.params.productId);

  const available = product.inventory.quantity > 0;

  res.json({ available, quantity: product.inventory.quantity });
});

// Mock database functions
function getOrder(id) {
  // Sometimes returns null (like a missing database record)
  return Math.random() > 0.5 ? {
    id,
    items: [{ name: 'Widget', price: 10.99 }]
  } : null;
}

function getProduct(id) {
  // Sometimes missing inventory data
  return Math.random() > 0.3 ? {
    id,
    name: 'Sample Product',
    inventory: { quantity: Math.floor(Math.random() * 10) }
  } : {
    id,
    name: 'Sample Product'
    // Missing inventory property
  };
}

// Sentry error handler must be after routes
app.use(Sentry.Handlers.errorHandler());

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📊 Try these endpoints to generate Sentry errors:');
  console.log(`   GET http://localhost:${PORT}/orders/123`);
  console.log(`   GET http://localhost:${PORT}/inventory/456`);
});
