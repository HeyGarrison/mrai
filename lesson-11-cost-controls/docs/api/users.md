# API Documentation: User Management

This document provides detailed information about the user management functions available in the `api/users.js` file. It includes descriptions of each function, parameter details, and usage examples to assist developers in effectively utilizing the code.

## Functions

### 1. `getUserById(id)`

Retrieves a user from the database based on the provided user ID.

#### Parameters
- **id** (String): The unique identifier of the user. This parameter is required.
  - **Example**: `'12345'`

#### Returns
- **Object**: An object containing the user's details, including:
  - `id` (String): The user's unique identifier.
  - `name` (String): The user's name.
  - `email` (String): The user's email address.
  - `role` (String): The user's role (e.g., 'user', 'admin').
  - `createdAt` (Date): The date the user was created.

#### Errors
- Throws an error if:
  - The `id` parameter is not provided.
  - A user with the specified ID does not exist.

#### Usage Example
```javascript
async function fetchUser() {
  try {
    const user = await getUserById('12345');
    console.log(user);
  } catch (error) {
    console.error(error.message);
  }
}
```

### 2. `createUser(userData)`

Creates a new user in the database with the provided user data.

#### Parameters
- **userData** (Object): An object containing the user's information. This parameter is required and must include:
  - **name** (String): The name of the user. This field is required.
  - **email** (String): The email address of the user. This field is required.
  - **role** (String, optional): The role of the user. Defaults to `'user'` if not provided.
    - **Example**: `{ name: 'John Doe', email: 'john.doe@example.com', role: 'admin' }`

#### Returns
- **Object**: The newly created user object.

#### Errors
- Throws an error if:
  - The `name` or `email` fields are not provided.
  - A user with the specified email already exists.

#### Usage Example
```javascript
async function registerUser() {
  try {
    const newUser = await createUser({
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    });
    console.log('User created:', newUser);
  } catch (error) {
    console.error(error.message);
  }
}
```

## Summary

This documentation provides a clear understanding of the user management functions available in the `api/users.js` file. By following the parameter requirements and utilizing the provided examples, developers can effectively implement user retrieval and creation functionalities in their applications.