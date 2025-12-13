const express = require('express');
const router = express.Router();
const { createPost, inviteTeamMember, updateProfile, getStartups } = require('../controllers/startupController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { postLimiter } = require('../middlewares/rateLimiter');

// Public or Protected? Let's assume Protected as it's an internal platform
router.get('/', protect, getStartups);

// Startup specific routes
router.post('/posts', protect, authorize('Startup'), postLimiter, createPost);
router.post('/teams/invite', protect, authorize('Startup'), inviteTeamMember);
router.put('/profile', protect, authorize('Startup'), updateProfile);

module.exports = router;
