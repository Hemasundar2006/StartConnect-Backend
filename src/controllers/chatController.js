const Message = require('../models/Message');
const Team = require('../models/Team');
const mongoose = require('mongoose');

/**
 * Get chat history for a specific team
 * GET /api/chat/:teamId
 */
const getChatHistory = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;

        // Validate teamId format
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: 'Invalid team ID format' });
        }

        // Verify user is member of the team
        const team = await Team.findById(teamId);
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is a member or leader of the team
        const isMember = team.members.some(memberId => memberId.toString() === userId.toString());
        const isLeader = team.leaderId.toString() === userId.toString();

        if (!isMember && !isLeader) {
            return res.status(403).json({ 
                message: 'Access denied: You are not a member of this team' 
            });
        }

        // Fetch last 50 messages for the team
        const messages = await Message.find({ 
            teamId,
            isDeleted: false // Don't return deleted messages
        })
        .sort({ timestamp: -1 }) // Most recent first
        .limit(50)
        .populate('senderId', 'name email profilePicture role') // Populate sender details
        .lean(); // Convert to plain JavaScript objects for better performance

        // Reverse to get chronological order (oldest first)
        const chronologicalMessages = messages.reverse();

        res.status(200).json({
            success: true,
            count: chronologicalMessages.length,
            teamId,
            messages: chronologicalMessages
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ 
            message: 'Failed to fetch chat history',
            error: error.message 
        });
    }
};

/**
 * Delete a message (soft delete)
 * DELETE /api/chat/message/:messageId
 */
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        // Validate messageId format
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ message: 'Invalid message ID format' });
        }

        // Find the message
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user is the sender of the message
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'Access denied: You can only delete your own messages' 
            });
        }

        // Soft delete the message
        message.isDeleted = true;
        await message.save();

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ 
            message: 'Failed to delete message',
            error: error.message 
        });
    }
};

/**
 * Mark messages as read
 * POST /api/chat/:teamId/read
 */
const markMessagesAsRead = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.user._id;
        const { messageIds } = req.body;

        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ message: 'Invalid message IDs' });
        }

        // Update messages to mark as read
        await Message.updateMany(
            {
                _id: { $in: messageIds },
                teamId,
                'readBy.userId': { $ne: userId } // Don't add duplicate read entries
            },
            {
                $push: {
                    readBy: {
                        userId,
                        readAt: new Date()
                    }
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });

    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ 
            message: 'Failed to mark messages as read',
            error: error.message 
        });
    }
};

module.exports = {
    getChatHistory,
    deleteMessage,
    markMessagesAsRead
};

