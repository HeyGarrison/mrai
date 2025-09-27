# Documentation for `server/api/users.js`

This document provides comprehensive documentation for the user management API defined in the `server/api/users.js` file. The API supports two main operations: retrieving a list of users and creating a new user.

## Overview

The API is designed to handle HTTP requests for user management. It supports the following methods:
- `GET`: Retrieve a list of users with optional pagination and search functionality.
- `POST`: Create a new user with required fields.

## Function Documentation

### `defineEventHandler`

This is the main event handler that processes incoming HTTP requests. It determines the request method and delegates the request to the appropriate function.

#### Parameters
- `event`: The event object containing details about the HTTP request.

#### Returns
- A promise that resolves to the response object based on the request method.

### `getUsers(event)`

Retrieves a list of users from a mock database, with optional pagination and search functionality.

#### Parameters
- `event`: The event object containing details about the HTTP request.

#### Returns
- A promise that resolves to an object containing:
  - `users`: An array of user objects.
  - `pagination`: An object with `page` and `limit` indicating the current pagination state.
  - `total`: The total number of users available.

#### Example Response
```json
{
  "users": [
    { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "user" }
  ],
  "pagination": { "page": 1, "limit": 10 },
  "total": 4
}
```

### `createUser(event)`

Creates a new user based on the provided request body.

#### Parameters
- `event`: The event object containing details about the HTTP request.

#### Returns
- A promise that resolves to an object containing:
  - `user`: The newly created user object.
  - `message`: A success message indicating the user was created.

#### Example Response
```json
{
  "user": {
    "id": 1633036800000,
    "name": "New User",
    "email": "newuser@example.com",
    "created": "2023-10-01T12:00:00.000Z"
  },
  "message": "User created successfully"
}
```

## Parameter Details

### `GET` Request Parameters
- **Query Parameters**:
  - `page` (optional): The page number for pagination. Default is `1`.
  - `limit` (optional): The number of users to return per page. Default is `10`.
  - `search` (optional): A string to filter users by name or email.

#### Example Query
```
GET /api/users?page=1&limit=5&search=John
```

### `POST` Request Body
- **Body Parameters**:
  - `name` (required): The name of the user to be created.
  - `email` (required): The email address of the user to be created.

#### Example Body
```json
{
  "name": "New User",
  "email": "newuser@example.com"
}
```

## Usage Examples

### Example: Retrieving Users

To retrieve a list of users with pagination and search, you can use the following code:

```javascript
async function fetchUsers(page, limit, search) {
    const response = await fetch(`/api/users?page=${page}&limit=${limit}&search=${search}`);
    const data = await response.json();
    console.log(data);
}

// Fetch the first page of users with a limit of 5
fetchUsers(1, 5, 'John');
```

### Example: Creating a New User

To create a new user, you can use the following code:

```javascript
async function addUser(name, email) {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
    });
    
    const data = await response.json();
    console.log(data);
}

// Create a new user
addUser('New User', 'newuser@example.com');
```

## Error Handling

The API handles errors by throwing appropriate HTTP errors:
- **405 Method Not Allowed**: Returned when an unsupported HTTP method is used.
- **400 Bad Request**: Returned when required fields are missing in the request body for user creation.

### Example Error Response
```json
{
  "statusCode": 400,
  "statusMessage": "Name and email are required"
}
```

## Conclusion

This documentation provides a clear understanding of how to use the user management API defined in `server/api/users.js`. By following the examples and guidelines, developers can effectively integrate user management functionalities into their applications.