// server/api/users.js
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  if (method === 'GET') {
    return await getUsers(event);
  } else if (method === 'POST') {
    return await createUser(event);
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  });
});

async function getUsers(event) {
  const query = getQuery(event);
  const { page = 1, limit = 10, search } = query;
  
  // Simulate database query
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  return {
    users: search ? users.filter(u => u.name.includes(search)) : users,
    pagination: { page: parseInt(page), limit: parseInt(limit) },
    total: users.length
  };
}

async function createUser(event) {
  const body = await readBody(event);
  
  if (!body.name || !body.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: Date.now(),
    name: body.name,
    email: body.email,
    created: new Date().toISOString()
  };
  
  return { user: newUser, message: 'User created successfully' };
}