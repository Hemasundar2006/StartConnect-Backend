const express = require('express');
const router = express.Router();
const { getFeedPosts } = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/posts', protect, getFeedPosts);

module.exports = router;
