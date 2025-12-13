const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post', // Optional, if the action is on a post
    },
    action: {
        type: String, // e.g., 'APPROVE_POST', 'REJECT_POST', 'BAN_USER'
        required: true,
    },
    details: String,
}, { timestamps: true });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
