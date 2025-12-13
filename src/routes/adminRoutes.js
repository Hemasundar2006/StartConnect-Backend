const express = require('express');
const router = express.Router();
const { getPendingPosts, approvePost, logModeration } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('Admin'));

router.get('/posts/pending', getPendingPosts);
router.put('/posts/:postId/approve', approvePost);
router.post('/moderation/log', logModeration);

module.exports = router;
