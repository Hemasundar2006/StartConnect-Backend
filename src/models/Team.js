const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    leaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StartupProfile',
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingInvites: [{
        email: String,
        token: String,
        invitedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
