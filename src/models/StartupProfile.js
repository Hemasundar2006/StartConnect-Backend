const mongoose = require('mongoose');

const journeyMilestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    date: {
        type: Date,
        required: true,
    },
    type: {
        type: String,
        enum: ['Launch', 'Funding', 'Partnership', 'Achievement', 'Milestone', 'Other'],
        default: 'Milestone',
    },
}, { _id: true });

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
    },
    // Startup Details
    industry: {
        type: String,
    },
    foundedDate: {
        type: Date,
    },
    location: {
        city: String,
        state: String,
        country: String,
    },
    size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    },
    stage: {
        type: String,
        enum: ['Idea', 'MVP', 'Early Stage', 'Growth', 'Scale', 'Mature'],
    },
    fundingStage: {
        type: String,
        enum: ['Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO'],
    },
    // Journey Information
    journey: {
        milestones: {
            type: [journeyMilestoneSchema],
            default: [],
        },
        story: {
            type: String, // The startup's story/journey narrative
        },
        achievements: {
            type: [{
                title: String,
                description: String,
                date: Date,
            }],
            default: [],
        },
    },
    // Additional Information
    contactInfo: {
        email: String,
        phone: String,
        address: String,
    },
    socialMedia: {
        linkedin: String,
        twitter: String,
        facebook: String,
        instagram: String,
        github: String,
    },
    tags: [{
        type: String,
    }],
    // Products/Services
    products: [{
        name: String,
        description: String,
    }],
    // Team Information
    teamSize: {
        type: Number,
        default: 1,
    },
    // Additional details
    mission: {
        type: String,
    },
    vision: {
        type: String,
    },
    values: [{
        type: String,
    }],
}, { timestamps: true });

module.exports = mongoose.model('StartupProfile', startupProfileSchema);
