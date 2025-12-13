const Post = require('../models/Post');
const ModerationLog = require('../models/ModerationLog');
const StartupProfile = require('../models/StartupProfile');
const User = require('../models/User');
const Team = require('../models/Team');

// @desc    Get pending posts
// @route   GET /api/admin/posts/pending
// @access  Private (Admin)
exports.getPendingPosts = async (req, res) => {
    try {
        const posts = await Post.find({ isApproved: false }).populate('authorId', 'name email');
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve a post
// @route   PUT /api/admin/posts/:postId/approve
// @access  Private (Admin)
exports.approvePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.isApproved = true;
        await post.save();

        // Log action
        await ModerationLog.create({
            adminId: req.user.id,
            postId: post._id,
            action: 'APPROVE_POST',
            details: 'Post approved by admin'
        });

        res.json({ message: 'Post approved', post });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log moderation action
// @route   POST /api/admin/moderation/log
// @access  Private (Admin)
exports.logModeration = async (req, res) => {
    try {
        const { postId, action, details } = req.body;

        const log = await ModerationLog.create({
            adminId: req.user.id,
            postId,
            action,
            details
        });

        res.status(201).json(log);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all startups with full details
// @route   GET /api/admin/startups
// @access  Private (Admin)
exports.getAllStartups = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, stage, fundingStage, isVerified } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (search) {
            query.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { industry: { $regex: search, $options: 'i' } }
            ];
        }
        if (stage) query.stage = stage;
        if (fundingStage) query.fundingStage = fundingStage;
        if (isVerified !== undefined) query.isDomainVerified = isVerified === 'true';

        const startups = await StartupProfile.find(query)
            .populate('userId', 'name email role isVerified verificationBadge')
            .populate('teamId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await StartupProfile.countDocuments(query);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            startups
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get startup details by ID (Admin view)
// @route   GET /api/admin/startups/:id
// @access  Private (Admin)
exports.getStartupDetails = async (req, res) => {
    try {
        // First get the startup profile without populating to get the userId ObjectId
        const startupProfileBase = await StartupProfile.findById(req.params.id);
        
        if (!startupProfileBase) {
            return res.status(404).json({ message: 'Startup not found' });
        }

        // Store userId before population
        const userId = startupProfileBase.userId;

        // Now populate for the response
        const startupProfile = await StartupProfile.findById(req.params.id)
            .populate('userId', 'name email role isVerified verificationBadge createdAt')
            .populate('teamId')
            .populate({
                path: 'teamId',
                populate: {
                    path: 'members',
                    select: 'name email role'
                }
            });

        // Get related posts
        const posts = await Post.find({ authorId: userId })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            startup: startupProfile,
            recentPosts: posts,
            statistics: {
                totalPosts: await Post.countDocuments({ authorId: userId }),
                approvedPosts: await Post.countDocuments({ authorId: userId, isApproved: true }),
                pendingPosts: await Post.countDocuments({ authorId: userId, isApproved: false }),
                milestonesCount: startupProfile.journey?.milestones?.length || 0,
                achievementsCount: startupProfile.journey?.achievements?.length || 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get startup statistics
// @route   GET /api/admin/startups/statistics
// @access  Private (Admin)
exports.getStartupStatistics = async (req, res) => {
    try {
        const totalStartups = await StartupProfile.countDocuments();
        const verifiedStartups = await StartupProfile.countDocuments({ isDomainVerified: true });
        const unverifiedStartups = totalStartups - verifiedStartups;

        // Statistics by stage
        const stageStats = await StartupProfile.aggregate([
            { $group: { _id: '$stage', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Statistics by funding stage
        const fundingStats = await StartupProfile.aggregate([
            { $group: { _id: '$fundingStage', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Statistics by size
        const sizeStats = await StartupProfile.aggregate([
            { $group: { _id: '$size', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Statistics by industry
        const industryStats = await StartupProfile.aggregate([
            { $match: { industry: { $exists: true, $ne: null } } },
            { $group: { _id: '$industry', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRegistrations = await StartupProfile.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Startups with complete profiles
        const completeProfiles = await StartupProfile.countDocuments({
            $and: [
                { description: { $exists: true, $ne: '' } },
                { industry: { $exists: true, $ne: null } },
                { location: { $exists: true } },
                { 'journey.story': { $exists: true, $ne: '' } }
            ]
        });

        res.json({
            success: true,
            overview: {
                totalStartups,
                verifiedStartups,
                unverifiedStartups,
                recentRegistrations,
                completeProfiles,
                incompleteProfiles: totalStartups - completeProfiles
            },
            byStage: stageStats,
            byFundingStage: fundingStats,
            bySize: sizeStats,
            topIndustries: industryStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update startup verification status
// @route   PUT /api/admin/startups/:id/verify
// @access  Private (Admin)
exports.updateStartupVerification = async (req, res) => {
    try {
        const { isDomainVerified } = req.body;

        const startupProfile = await StartupProfile.findById(req.params.id);
        if (!startupProfile) {
            return res.status(404).json({ message: 'Startup not found' });
        }

        startupProfile.isDomainVerified = isDomainVerified;
        await startupProfile.save();

        // Update user verification badge
        const user = await User.findById(startupProfile.userId);
        if (user) {
            if (isDomainVerified && !user.verificationBadge.includes('Verified Company')) {
                user.verificationBadge.push('Verified Company');
            } else if (!isDomainVerified) {
                user.verificationBadge = user.verificationBadge.filter(
                    badge => badge !== 'Verified Company'
                );
            }
            await user.save();
        }

        // Log action
        await ModerationLog.create({
            adminId: req.user.id,
            action: isDomainVerified ? 'VERIFY_STARTUP' : 'UNVERIFY_STARTUP',
            details: `Startup ${isDomainVerified ? 'verified' : 'unverified'} by admin`
        });

        res.json({
            message: `Startup ${isDomainVerified ? 'verified' : 'unverified'} successfully`,
            startupProfile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
