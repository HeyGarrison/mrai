// utils.js - Type error
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase() // Bug: currency might not be a string
    }).format(amount);
}

module.exports = { formatCurrency };