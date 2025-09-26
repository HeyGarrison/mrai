# API Documentation for `api/users.js`

This document provides comprehensive documentation for the user management functions defined in the `api/users.js` file. The module includes functions to create, retrieve, and update user information, along with mock implementations of a database and an email service.

## Functions Overview

### 1. `createUser(userData, options = {})`

Creates a new user with the provided data and optional settings.

#### Parameters:
- **`userData`**: `Object`
  - **Required**: `true`
  - **Description**: An object containing user information.
  - **Properties**:
    - **`email`**: `String` - The email address of the user. This is required.
    - **`name`**: `String` (optional) - The name of the user. Defaults to 'Anonymous' if not provided.
  
- **`options`**: `Object` (optional)
  - **Description**: An object containing optional settings for user creation.
  - **Properties**:
    - **`autoActivate`**: `Boolean` (optional) - If `true`, the user will be marked as active upon creation. Defaults to `false`.
    - **`preferences`**: `Object` (optional) - User-specific preferences.
    - **`sendWelcomeEmail`**: `Boolean` (optional) - If `true`, a welcome email will be sent to the user after creation.

#### Returns:
- **`Object`**: The newly created user object.

#### Throws:
- **`Error`**: If `userData` is not provided or if the `email` property is missing.

#### Usage Example:
```javascript
const { createUser } = require('./api/users');

const newUser = createUser({
  email: 'user@example.com',
  name: 'John Doe'
}, {
  autoActivate: true,
  sendWelcomeEmail: true
});

console.log(newUser);
```

### 2. `getUserById(id)`

Retrieves a user by their unique identifier.

#### Parameters:
- **`id`**: `String`
  - **Required**: `true`
  - **Description**: The unique identifier of the user to retrieve.

#### Returns:
- **`Object`**: The user object corresponding to the provided ID.

#### Throws:
- **`Error`**: If `id` is not provided or if no user is found with the given ID.

#### Usage Example:
```javascript
const { getUserById } = require('./api/users');

try {
  const user = getUserById('12345');
  console.log(user);
} catch (error) {
  console.error(error.message);
}
```

### 3. `updateUser(id, updates)`

Updates an existing user's information.

#### Parameters:
- **`id`**: `String`
  - **Required**: `true`
  - **Description**: The unique identifier of the user to update.

- **`updates`**: `Object`
  - **Required**: `true`
  - **Description**: An object containing the properties to update on the user.

#### Returns:
- **`Object`**: The updated user object.

#### Throws:
- **`Error`**: If the user with the specified ID does not exist.

#### Usage Example:
```javascript
const { updateUser } = require('./api/users');

try {
  const updatedUser = updateUser('12345', { name: 'Jane Doe' });
  console.log(updatedUser);
} catch (error) {
  console.error(error.message);
}
```

## Mock Database and Email Service

The module includes mock implementations of a database and an email service for demonstration purposes.

### Mock Database
```javascript
const database = {
  save: (table, data) => console.log(`Saving to ${table}:`, data),
  findById: (table, id) => ({ id, email: 'test@example.com', name: 'Test User' })
};
```

### Mock Email Service
```javascript
const emailService = {
  sendWelcome: (email, name) => console.log(`Sending welcome email to ${email}`)
};
```

## Exported Functions
The following functions are exported from the module:
- `createUser`
- `getUserById`
- `updateUser`

This documentation provides a clear understanding of the user management functions available in `api/users.js`, including their parameters, return values, and usage examples.