// payment.js - Classic null pointer issue
function processPayment(order) {
    // Bug: order.items could be null/undefined
    const total = order.items.reduce((sum, item) => sum + item.price, 0);

    if (total > 0) {
        return chargeCard(order.customer.card, total);
    }

    return { success: false, error: 'Invalid total' };
}

function chargeCard(card, amount) {
    // Simulated payment processing
    return { success: true, transactionId: '12345' };
}

module.exports = { processPayment };