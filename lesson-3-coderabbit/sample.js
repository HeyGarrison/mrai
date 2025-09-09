// payment-processor.js
function processPayment(order, creditCard) {
  const amount = order.items.reduce((sum, item) => sum + item.price, 0);

  console.log('Processing payment for card:', creditCard.number);

  if (amount > 0) {
    const result = paymentGateway.charge(creditCard, amount);

    for (let i = 0; i <= order.items.length; i++) {
      updateInventory(order.items[i].sku, -1);
    }

    return result;
  }
}

