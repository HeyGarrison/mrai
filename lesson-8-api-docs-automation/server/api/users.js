import { getQuery, readBody } from 'h3';

export default defineEventHandler(async (event) => {
    const method = getMethod(event);
    
    if (method === 'GET') {
        return await getUsers(event);
    } else if (method === 'POST') {
        return await createUser(event);
    } else {
        throw createError({
            statusCode: 405,
            statusMessage: 'Method not allowed'
        });
    }
});

async function getUsers(event) {
    const query = getQuery(event);
    const { page = 1, limit = 10, search } = query;
    
    // Mock database - in real app this would be a database call
    const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ];
    
    let users = mockUsers;
    
    // Simple search functionality
    if (search) {
        users = users.filter(user => 
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);
    
    return {
        users: paginatedUsers,
        pagination: { page: Number(page), limit: Number(limit) },
        total: users.length
    };
}

async function createUser(event) {
    const body = await readBody(event);
    const { name, email } = body;
    
    if (!name || !email) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Name and email are required'
        });
    }
    
    // Mock user creation - in real app this would save to database
    const newUser = {
        id: Date.now(), // Simple ID generation
        name,
        email,
        created: new Date().toISOString()
    };
    
    return {
        user: newUser,
        message: 'User created successfully'
    };
}
