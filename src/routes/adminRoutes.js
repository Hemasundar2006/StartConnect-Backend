const express = require('express');
const router = express.Router();
const {
    getPendingPosts,
    approvePost,
    logModeration,
    getAllStartups,
    getStartupDetails,
    getStartupStatistics,
    updateStartupVerification
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('Admin'));

// Post moderation routes
router.get('/posts/pending', getPendingPosts);
router.put('/posts/:postId/approve', approvePost);
router.post('/moderation/log', logModeration);

// Startup tracking routes
router.get('/startups', getAllStartups);
router.get('/startups/statistics', getStartupStatistics);
router.get('/startups/:id', getStartupDetails);
router.put('/startups/:id/verify', updateStartupVerification);

module.exports = router;
