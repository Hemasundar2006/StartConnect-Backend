const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getChatHistory,
    deleteMessage,
    markMessagesAsRead
} = require('../controllers/chatController');

// Apply authentication middleware to all chat routes
router.use(protect);

// Get chat history for a team
router.get('/:teamId', getChatHistory);

// Delete a message
router.delete('/message/:messageId', deleteMessage);

// Mark messages as read
router.post('/:teamId/read', markMessagesAsRead);

module.exports = router;

