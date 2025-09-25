function calculateCartTotal(items, discountCode, shippingZone) {
    let subtotal = 0;

    if (items && Array.isArray(items)) {
        for (let item of items) {
            subtotal += item.price * item.quantity;
        }
    }

    // Apply discount
    if (discountCode) {
        const discount = getDiscount(discountCode);
        if (discount) {
            subtotal = subtotal - (subtotal * discount.percentage / 100);
        }
    }

    // Add shipping
    const shippingCost = calculateShipping(subtotal, shippingZone);
    const total = parseFloat((subtotal + shippingCost).toFixed(2));

    return { subtotal: parseFloat(subtotal.toFixed(2)), shippingCost, total };
}

function getDiscount(code) {
    const discounts = {
        'SAVE20': { percentage: 20 },
        'SAVE10': { percentage: 10 }
    };
    return discounts[code];
}

function calculateShipping(subtotal, zone) {
    if (zone === 'domestic') return 5.99;
    if (zone === 'international') return 15.99;
    return 0;
}

module.exports = { calculateCartTotal };