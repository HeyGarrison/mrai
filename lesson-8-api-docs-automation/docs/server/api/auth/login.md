# Documentation for `server/api/auth/login.js`

## Overview

This module handles user login functionality for an API. It processes incoming login requests, validates the provided credentials, and returns authentication tokens upon successful login. The implementation includes error handling for various scenarios, such as unsupported HTTP methods and missing or invalid credentials.

## Function Documentation

### `defineEventHandler`

This is the main function exported by the module. It defines an event handler that processes login requests.

#### Description
- The function checks if the incoming request method is `POST`.
- It reads the request body to extract the user's email and password.
- It validates the presence of both email and password.
- It performs mock authentication against hardcoded credentials.
- On successful authentication, it returns a mock JWT token, a refresh token, user details, and expiration information.
- If authentication fails or if the request method is not `POST`, it throws an appropriate error.

### Error Handling
- **405 Method Not Allowed**: Thrown if the request method is not `POST`.
- **400 Bad Request**: Thrown if either email or password is missing.
- **401 Unauthorized**: Thrown if the provided credentials are invalid.

## Parameter Details

### `event`
- **Type**: `Object`
- **Description**: The event object representing the incoming HTTP request.
- **Requirements**: Must contain the request method and body.
- **Example**: 
  ```json
  {
      "method": "POST",
      "body": {
          "email": "user@example.com",
          "password": "userpassword"
      }
  }
  ```

### Request Body
- **Type**: `Object`
- **Properties**:
  - `email` (string, required): The user's email address.
  - `password` (string, required): The user's password.
- **Example**:
  ```json
  {
      "email": "admin@example.com",
      "password": "password123"
  }
  ```

### Response
- **Type**: `Object`
- **Properties**:
  - `token` (string): A mock JWT token for the authenticated session.
  - `refreshToken` (string): A mock refresh token for obtaining new access tokens.
  - `user` (Object): Contains user details.
    - `id` (number): The user's unique identifier.
    - `email` (string): The user's email address.
    - `name` (string): The user's name.
    - `role` (string): The user's role (e.g., 'admin').
    - `permissions` (Array): List of permissions assigned to the user.
    - `lastLogin` (string): Timestamp of the last login in ISO format.
  - `expiresIn` (string): Duration for which the token is valid (e.g., '24h').
  - `refreshExpiresIn` (string): Duration for which the refresh token is valid (e.g., '7d').
  - `message` (string): A success message indicating the login status.

## Usage Examples

### Example 1: Successful Login

```javascript
async function loginUser() {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'admin@example.com',
            password: 'password123'
        })
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
    } else {
        const error = await response.json();
        console.error('Login failed:', error);
    }
}

loginUser();
```

### Example 2: Handling Invalid Credentials

```javascript
async function loginUserWithInvalidCredentials() {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'wrong@example.com',
            password: 'wrongpassword'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Login failed:', error.message); // Expected output: "Invalid credentials"
    }
}

loginUserWithInvalidCredentials();
```

### Example 3: Handling Missing Credentials

```javascript
async function loginUserWithoutCredentials() {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: '' // Missing password
        })
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Login failed:', error.message); // Expected output: "Email and password are required"
    }
}

loginUserWithoutCredentials();
```

## Conclusion

This documentation provides a comprehensive overview of the login functionality implemented in `server/api/auth/login.js`. It includes details on the function's purpose, parameters, response structure, and practical usage examples to assist developers in integrating and utilizing this authentication feature effectively.