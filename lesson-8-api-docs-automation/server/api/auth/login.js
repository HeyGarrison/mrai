import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
    if (getMethod(event) !== 'POST') {
        throw createError({
            statusCode: 405,
            statusMessage: 'Method not allowed'
        });
    }
    
    const body = await readBody(event);
    const { email, password } = body;
    
    if (!email || !password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email and password are required'
        });
    }
    
    // Mock authentication - in real app this would verify against database
    if (email === 'admin@example.com' && password === 'password123') {
        return {
            token: 'mock-jwt-token-' + Date.now(),
            refreshToken: 'refresh-' + Date.now(),
            user: {
                id: 1,
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'admin',
                permissions: ['read', 'write', 'delete', 'admin'],
                lastLogin: new Date().toISOString()
            },
            expiresIn: '24h',
            refreshExpiresIn: '7d',
            message: 'Login successful'
        };
    }
    
    throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
    });
});
