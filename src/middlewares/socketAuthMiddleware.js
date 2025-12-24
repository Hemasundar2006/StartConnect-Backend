const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.io middleware for JWT authentication
 * Verifies the token from either:
 * 1. Handshake auth object (recommended)
 * 2. Query parameters (fallback)
 */
const socketAuthMiddleware = async (socket, next) => {
    try {
        // Extract token from auth or query params
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Find user in database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket object for use in socket handlers
        socket.user = user;
        socket.userId = user._id.toString();

        next();
    } catch (error) {
        console.error('Socket authentication error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return next(new Error('Authentication error: Invalid token'));
        }
        
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Authentication error: Token expired'));
        }

        return next(new Error('Authentication error: Failed to authenticate'));
    }
};

module.exports = socketAuthMiddleware;

