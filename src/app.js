const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const multer = require('multer');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const startupRoutes = require('./routes/startupRoutes');
const studentRoutes = require('./routes/studentRoutes');
const feedRoutes = require('./routes/feedRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Passport Config
require('./config/passport')(passport);
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files. Maximum 5 images per post.' });
        }
        return res.status(400).json({ message: err.message });
    }
    
    // Handle other errors
    const status = err.status || 500;
    res.status(status).json({
        message: err.message || 'Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

module.exports = app;
