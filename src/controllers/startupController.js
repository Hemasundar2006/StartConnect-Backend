const StartupProfile = require('../models/StartupProfile');
const Post = require('../models/Post');
const Team = require('../models/Team');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Create a new post
// @route   POST /api/startups/posts
// @access  Protected (Startup)
exports.createPost = async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        const post = new Post({
            authorId: req.user.id, // User is the author
            title,
            content,
            tags
        });

        await post.save();

        res.status(201).json({
            message: 'Post created successfully and pending approval',
            post
        });
    } catch (error) {
        console.error(error);
        if (error.status === 429) {
            return res.status(429).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Invite team member
// @route   POST /api/startups/teams/invite
// @access  Protected (Startup Leader)
exports.inviteTeamMember = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user is a leader
        const team = await Team.findOne({ leaderId: req.user.id });
        if (!team) {
            return res.status(403).json({ message: 'You are not a team leader' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        // If user exists, we might want to just add them or send notification. 
        // For now, let's just add to pending invites.

        const token = crypto.randomBytes(20).toString('hex');

        team.pendingInvites.push({
            email,
            token
        });

        await team.save();

        // Send email logic would go here

        res.json({ message: `Invitation sent to ${email}`, token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update startup profile
// @route   PUT /api/startups/profile
// @access  Protected (Startup Leader)
exports.updateProfile = async (req, res) => {
    try {
        const { companyName, website, description, logo } = req.body;

        const startupProfile = await StartupProfile.findOne({ userId: req.user.id });

        if (!startupProfile) {
            return res.status(404).json({ message: 'Startup profile not found' });
        }

        startupProfile.companyName = companyName || startupProfile.companyName;
        startupProfile.website = website || startupProfile.website;
        startupProfile.description = description || startupProfile.description;
        startupProfile.logo = logo || startupProfile.logo;

        await startupProfile.save();

        res.json(startupProfile);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all verified startups
// @route   GET /api/startups
// @access  Public/Protected (Student)
exports.getStartups = async (req, res) => {
    try {
        // Fetch startups where isDomainVerified is true (or check verificationBadge of user, but profile is easier)
        // Adjust logic based on strict requirement "verified startup profiles"
        const startups = await StartupProfile.find({ isDomainVerified: true });
        res.json(startups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
