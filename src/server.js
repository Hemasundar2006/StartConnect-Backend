require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketAuthMiddleware = require('./middlewares/socketAuthMiddleware');
const chatHandlers = require('./socket/chatHandlers');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || '*', // Configure based on your frontend URL
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000 // 25 seconds
});

// Apply JWT authentication middleware to Socket.io
io.use(socketAuthMiddleware);

// Initialize chat handlers
chatHandlers(io);

// Make io accessible to routes (optional, if needed for external broadcasts)
app.set('io', io);

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`💬 Socket.io is ready for real-time chat`);
});
