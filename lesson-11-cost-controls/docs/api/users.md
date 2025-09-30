# API Documentation: User Management

This document provides detailed information about the user management functions available in the `api/users.js` file. It includes descriptions of each function, parameter details, and usage examples to assist developers in effectively utilizing the code.

## Functions

### 1. `getUserById(id)`

Retrieves a user from the database based on the provided user ID.

#### Parameters
- **id** (String): The unique identifier of the user. This parameter is required.

#### Returns
- **Object**: An object containing the user's details, including:
  - **id** (String): The user's unique identifier.
  - **name** (String): The user's name.
  - **email** (String): The user's email address.
  - **role** (String): The user's role (e.g., 'user', 'admin').
  - **createdAt** (Date): The date the user was created.

#### Throws
- **Error**: If the user ID is not provided or if the user is not found in the database.

#### Usage Example
```javascript
async function exampleGetUserById() {
  try {
    const userId = '12345';
    const user = await getUserById(userId);
    console.log(user);
  } catch (error) {
    console.error(error.message);
  }
}
```

### 2. `createUser(userData)`

Creates a new user in the database with the provided user data.

#### Parameters
- **userData** (Object): An object containing the user's details. This parameter is required and must include:
  - **name** (String): The name of the user. This field is required.
  - **email** (String): The email address of the user. This field is required.
  - **role** (String, optional): The role of the user. Defaults to 'user' if not provided.

#### Returns
- **Object**: The newly created user object.

#### Throws
- **Error**: If the name or email is not provided, or if the email already exists in the database.

#### Usage Example
```javascript
async function exampleCreateUser() {
  try {
    const newUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin'
    };
    const createdUser = await createUser(newUser);
    console.log('User created:', createdUser);
  } catch (error) {
    console.error(error.message);
  }
}
```

This documentation provides a comprehensive overview of the user management functions, ensuring that developers can easily understand and implement the functionality provided in the `api/users.js` file.