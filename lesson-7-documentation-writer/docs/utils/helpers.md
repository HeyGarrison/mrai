# Documentation for `utils/helpers.js`

This module provides utility functions for formatting currency, debouncing function calls, and validating email addresses. Each function is designed to be reusable and can be easily integrated into various JavaScript applications.

## Functions

### 1. `formatCurrency(amount, currency = 'USD', locale = 'en-US')`

Formats a given numeric amount into a currency string based on the specified locale and currency type.

#### Parameters:
- **amount** (`number`): The numeric value to be formatted as currency. This is a required parameter.
  - Example: `1234.56`
  
- **currency** (`string`, optional): The three-letter currency code (ISO 4217) that specifies the currency type. Defaults to `'USD'`.
  - Example: `'EUR'`, `'JPY'`
  
- **locale** (`string`, optional): A string with a BCP 47 language tag that determines the locale formatting. Defaults to `'en-US'`.
  - Example: `'fr-FR'`, `'de-DE'`

#### Returns:
- **string**: A formatted currency string based on the provided amount, currency, and locale.

#### Usage Example:
```javascript
const { formatCurrency } = require('./utils/helpers');

const formattedAmount = formatCurrency(1234.56, 'EUR', 'fr-FR');
console.log(formattedAmount); // Outputs: "1 234,56 €"
```

---

### 2. `debounce(func, delay)`

Creates a debounced version of a function that delays its execution until after a specified delay in milliseconds has elapsed since the last time the debounced function was invoked.

#### Parameters:
- **func** (`function`): The function to debounce. This is a required parameter.
  - Example: `() => console.log('Executed!')`
  
- **delay** (`number`): The number of milliseconds to delay. This is a required parameter.
  - Example: `300`

#### Returns:
- **function**: A new debounced function that, when invoked, will delay the execution of `func` until after `delay` milliseconds have passed since the last invocation.

#### Usage Example:
```javascript
const { debounce } = require('./utils/helpers');

const logMessage = () => console.log('Debounced function executed!');
const debouncedLogMessage = debounce(logMessage, 500);

// This will only log once after 500ms if called multiple times
debouncedLogMessage();
debouncedLogMessage();
debouncedLogMessage();
```

---

### 3. `isValidEmail(email)`

Validates whether a given string is a valid email address format.

#### Parameters:
- **email** (`string`): The email address to validate. This is a required parameter.
  - Example: `'example@example.com'`

#### Returns:
- **boolean**: Returns `true` if the email address is valid according to the regex pattern; otherwise, returns `false`.

#### Usage Example:
```javascript
const { isValidEmail } = require('./utils/helpers');

const email1 = 'test@example.com';
const email2 = 'invalid-email';

console.log(isValidEmail(email1)); // Outputs: true
console.log(isValidEmail(email2)); // Outputs: false
```

---

## Exported Functions

The module exports the following functions for use in other parts of the application:

- `formatCurrency`
- `debounce`
- `isValidEmail`

## Conclusion

This documentation provides a comprehensive overview of the utility functions available in `utils/helpers.js`. Each function is designed to be straightforward and easy to use, with clear parameter definitions and practical examples to assist developers in integrating these utilities into their projects.