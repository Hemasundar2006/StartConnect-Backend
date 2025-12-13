const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['Student', 'Startup', 'Admin'],
        default: 'Student',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    verificationBadge: {
        type: [String],
        enum: ['Verified Company', 'Verified Student', 'Admin'],
        default: [],
    },
    // For students: School/University info could go here or in a separate profile
    schoolEmail: String,
    // For Student User: Link to Student Profile
    studentProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentProfile',
    },

    // For startup leaders/members: Link to a Team
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
    },
    // For Startup User: Link to Startup Profile
    startupProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StartupProfile',
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
