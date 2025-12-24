const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
        index: true, // Index for faster queries
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000, // Limit message length
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true, // Index for sorting by time
    },
    // Optional: add read status tracking
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Optional: support for attachments in future
    attachments: [{
        type: String,
        url: String
    }],
    // Soft delete capability
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index for efficient team message queries
messageSchema.index({ teamId: 1, timestamp: -1 });

// Virtual for sender details (populated)
messageSchema.virtual('sender', {
    ref: 'User',
    localField: 'senderId',
    foreignField: '_id',
    justOne: true
});

// Ensure virtuals are included in JSON output
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);

