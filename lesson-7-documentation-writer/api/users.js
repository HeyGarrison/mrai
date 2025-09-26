// api/users.js - needs documentation
function createUser(userData, options = {}) {
  if (!userData || !userData.email) {
    throw new Error('Email is required');
  }

  const user = {
    id: nanoid(),
    email: userData.email.toLowerCase(),
    name: userData.name || 'Anonymous',
    created: new Date(),
    active: options.autoActivate || false,
    preferences: options.preferences || {}
  };

  database.save('users', user);

  if (options.sendWelcomeEmail) {
    emailService.sendWelcome(user.email, user.name);
  }

  return user;
}

function getUserById(id) {
  if (!id) {
    throw new Error('User ID is required');
  }

  const user = database.findById('users', id);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

function updateUser(id, updates) {
  const existingUser = getUserById(id);

  const updatedUser = {
    ...existingUser,
    ...updates,
    updated: new Date()
  };

  database.save('users', updatedUser);
  return updatedUser;
}

// Mock database and email service for demo
const database = {
  save: (table, data) => console.log(`Saving to ${table}:`, data),
  findById: (table, id) => ({ id, email: 'test@example.com', name: 'Test User' })
};

const emailService = {
  sendWelcome: (email, name) => console.log(`Sending welcome email to ${email}`)
};

module.exports = { createUser, getUserById, updateUser };
