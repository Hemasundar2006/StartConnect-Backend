const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

const postLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 post creation requests per hour (Backup to the 3/week database limit)
    message: { message: 'Too many posts created from this IP, please try again later' }
});

module.exports = { loginLimiter, postLimiter };
