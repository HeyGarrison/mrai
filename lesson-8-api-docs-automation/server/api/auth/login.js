// server/api/auth/login.js
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required'
    });
  }
  
  // Simulate authentication
  if (body.email === 'demo@example.com' && body.password === 'password') {
    return {
      token: 'jwt-token-here',
      user: { id: 1, email: body.email, name: 'Demo User' },
      expiresIn: '24h'
    };
  }
  
  throw createError({
    statusCode: 401,
    statusMessage: 'Invalid credentials'
  });
});