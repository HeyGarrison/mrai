// Users management

export async function getUserById(id) {
  // Validate user ID parameter is provided
  if (!id) throw new Error('User ID is required');

  const user = await db.users.findById(id);
  if (!user) throw new Error('User not found');

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

export async function createUser(userData) {
  const { name, email, role = 'user' } = userData;

  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  const existingUser = await db.users.findByEmail(email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  return db.users.create({
    name,
    email,
    role
  });
}
