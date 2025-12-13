const mongoose = require('mongoose');

const startupProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    companyName: {
        type: String,
        required: true,
    },
    website: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    logo: String,
    // Domain verification status
    isDomainVerified: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('StartupProfile', startupProfileSchema);
