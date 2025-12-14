const StartupProfile = require('../models/StartupProfile');
const Post = require('../models/Post');
const Team = require('../models/Team');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailerUtils = require('../utils/nodemailer_config');
const sendEmail = nodemailerUtils;
const createInvitationEmailHTML = nodemailerUtils.createInvitationEmailHTML;

// @desc    Create a new post
// @route   POST /api/startups/posts
// @access  Protected (Startup)
exports.createPost = async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        // Handle uploaded images
        const images = [];
        if (req.files && req.files.length > 0) {
            const { getFileUrl } = require('../middlewares/uploadMiddleware');
            req.files.forEach(file => {
                images.push({
                    url: getFileUrl(req, file.filename),
                    filename: file.filename,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                });
            });
        }

        // Parse tags if it's a string
        let tagsArray = tags;
        if (typeof tags === 'string') {
            try {
                tagsArray = JSON.parse(tags);
            } catch (e) {
                tagsArray = tags.split(',').map(tag => tag.trim());
            }
        }

        const post = new Post({
            authorId: req.user.id, // User is the author
            title,
            content,
            tags: tagsArray,
            images: images
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
        // Clean up uploaded files if post creation fails
        if (req.files && req.files.length > 0) {
            const fs = require('fs');
            const path = require('path');
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../uploads/posts', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
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

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Use _id for consistency with Mongoose
        const userId = req.user._id || req.user.id;
        
        // Debug logging
        console.log('Invite request - User ID:', userId);
        console.log('Invite request - User role:', req.user.role);
        console.log('Invite request - User object:', { id: req.user.id, _id: req.user._id });

        // Check user role first
        if (req.user.role !== 'Startup') {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized. Only Startup users can invite team members.`,
                code: 'INVALID_ROLE',
                userRole: req.user.role
            });
        }

        // Check if user has a startup profile first
        const startupProfile = await StartupProfile.findOne({ userId: userId });
        if (!startupProfile) {
            console.log('No startup profile found for user:', userId);
            return res.status(403).json({ 
                message: 'Startup profile not found. Please complete your startup registration first.',
                code: 'NO_STARTUP_PROFILE',
                userId: userId.toString()
            });
        }

        console.log('Startup profile found:', startupProfile._id);

        // Check if user is a leader - try both _id and id formats
        let team = await Team.findOne({ leaderId: userId }).populate('companyId');
        if (!team) {
            // Try with string format
            team = await Team.findOne({ leaderId: userId.toString() }).populate('companyId');
        }
        if (!team) {
            // Try with ObjectId format
            const mongoose = require('mongoose');
            team = await Team.findOne({ leaderId: new mongoose.Types.ObjectId(userId) }).populate('companyId');
        }
        
        if (!team) {
            console.log('No team found for leader:', userId);
            return res.status(403).json({ 
                message: 'You are not a team leader. Team may not have been created during registration.',
                code: 'NOT_TEAM_LEADER',
                userId: userId.toString(),
                startupProfileId: startupProfile._id.toString(),
                suggestion: 'Please ensure you completed registration as a Startup. If you just registered, try logging out and back in, or contact support.'
            });
        }

        console.log('Team found:', team._id);

        // Check if email is already invited
        const existingInvite = team.pendingInvites.find(invite => invite.email === email);
        if (existingInvite) {
            return res.status(400).json({ message: 'Invitation already sent to this email' });
        }

        // Check if user already exists and is a member
        const existingUser = await User.findOne({ email });
        if (existingUser && team.members.includes(existingUser._id)) {
            return res.status(400).json({ message: 'User is already a team member' });
        }

        // Verify startup profile matches team's company
        const companyId = team.companyId._id ? team.companyId._id.toString() : team.companyId.toString();
        if (startupProfile._id.toString() !== companyId) {
            return res.status(404).json({ message: 'Startup profile does not match team company' });
        }

        // Get inviter details
        const inviter = await User.findById(req.user.id);

        // Generate invitation token
        const token = crypto.randomBytes(32).toString('hex');

        // Add to pending invites
        team.pendingInvites.push({
            email,
            token,
            invitedAt: new Date()
        });

        await team.save();

        // Create confirmation link
        const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const confirmationLink = `${baseUrl}/api/startups/teams/accept-invitation?token=${token}&email=${encodeURIComponent(email)}`;

        // Create email content
        const emailSubject = `Invitation to join ${startupProfile.companyName} on StartConnect`;
        const emailHTML = createInvitationEmailHTML(
            startupProfile.companyName,
            startupProfile.website,
            startupProfile.description,
            startupProfile.logo,
            confirmationLink,
            inviter.name
        );
        const emailText = `
Hello,

${inviter.name} has invited you to join their team at ${startupProfile.companyName} on StartConnect.

Company Details:
- Name: ${startupProfile.companyName}
- Website: ${startupProfile.website}
${startupProfile.description ? `- Description: ${startupProfile.description}` : ''}

Click the link below to accept this invitation:
${confirmationLink}

If you did not expect this invitation, you can safely ignore this email.

Best regards,
StartConnect Team
        `;

        // Send invitation email
        try {
            await sendEmail(email, emailSubject, emailText, emailHTML);
            res.json({
                success: true,
                message: `Invitation sent successfully to ${email}`,
                invitationLink: confirmationLink // For testing purposes
            });
        } catch (emailError) {
            console.error('Error sending invitation email:', emailError);
            // Still save the invitation even if email fails
            res.json({
                success: true,
                message: `Invitation created but email sending failed. Link: ${confirmationLink}`,
                warning: 'Email could not be sent. Please check email configuration.',
                invitationLink: confirmationLink
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Accept team invitation
// @route   GET /api/startups/teams/accept-invitation
// @access  Public
exports.acceptInvitation = async (req, res) => {
    try {
        const { token, email } = req.query;

        if (!token || !email) {
            return res.status(400).json({ message: 'Token and email are required' });
        }

        // Find team with this invitation
        const team = await Team.findOne({
            'pendingInvites.email': email,
            'pendingInvites.token': token
        }).populate('companyId');

        if (!team) {
            return res.status(404).json({ message: 'Invalid or expired invitation' });
        }

        const invite = team.pendingInvites.find(inv => inv.email === email && inv.token === token);
        if (!invite) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        // Check if invitation is expired (30 days)
        const inviteAge = Date.now() - new Date(invite.invitedAt).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (inviteAge > thirtyDays) {
            // Remove expired invitation
            team.pendingInvites = team.pendingInvites.filter(
                inv => !(inv.email === email && inv.token === token)
            );
            await team.save();
            return res.status(400).json({ message: 'Invitation has expired' });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            // User doesn't exist - they need to register first
            return res.status(200).json({
                success: false,
                message: 'Please register first to accept the invitation',
                requiresRegistration: true,
                email: email,
                companyName: team.companyId?.companyName || 'the company'
            });
        }

        // Check if user is already a member
        if (team.members.includes(user._id)) {
            // Remove invitation since user is already a member
            team.pendingInvites = team.pendingInvites.filter(
                inv => !(inv.email === email && inv.token === token)
            );
            await team.save();
            return res.status(200).json({
                success: true,
                message: 'You are already a member of this team'
            });
        }

        // Add user to team
        if (!team.members.includes(user._id)) {
            team.members.push(user._id);
        }

        // Update user's teamId if not set
        if (!user.teamId) {
            user.teamId = team._id;
            await user.save();
        }

        // Remove invitation from pending
        team.pendingInvites = team.pendingInvites.filter(
            inv => !(inv.email === email && inv.token === token)
        );

        await team.save();

        res.json({
            success: true,
            message: 'Invitation accepted successfully. You are now a team member.',
            team: {
                id: team._id,
                companyName: team.companyId?.companyName
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get startup profile
// @route   GET /api/startups/profile
// @access  Protected (Startup)
exports.getProfile = async (req, res) => {
    try {
        // Check if user has Startup role
        if (req.user.role !== 'Startup') {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized. Only Startup users can access this endpoint.`,
                code: 'INVALID_ROLE'
            });
        }

        const startupProfile = await StartupProfile.findOne({ userId: req.user.id })
            .populate('userId', 'name email role');

        if (!startupProfile) {
            // Check if user exists and has startupProfileId set
            const User = require('../models/User');
            const user = await User.findById(req.user.id);
            
            return res.status(404).json({ 
                message: 'Startup profile not found. Please complete your startup registration.',
                code: 'PROFILE_NOT_FOUND',
                userId: req.user.id,
                userRole: req.user.role,
                hasStartupProfileId: !!user?.startupProfileId,
                suggestion: 'If you just registered, there may have been an issue during profile creation. Please contact support or try registering again.'
            });
        }

        res.json(startupProfile);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update startup profile
// @route   PUT /api/startups/profile
// @access  Protected (Startup)
exports.updateProfile = async (req, res) => {
    try {
        const {
            companyName,
            website,
            description,
            logo,
            industry,
            foundedDate,
            location,
            size,
            stage,
            fundingStage,
            mission,
            vision,
            values,
            tags,
            contactInfo,
            socialMedia,
            products,
            teamSize
        } = req.body;

        const startupProfile = await StartupProfile.findOne({ userId: req.user.id });

        if (!startupProfile) {
            return res.status(404).json({ message: 'Startup profile not found' });
        }

        // Update basic info
        if (companyName !== undefined) startupProfile.companyName = companyName;
        if (website !== undefined) startupProfile.website = website;
        if (description !== undefined) startupProfile.description = description;
        if (logo !== undefined) startupProfile.logo = logo;

        // Update startup details
        if (industry !== undefined) startupProfile.industry = industry;
        if (foundedDate !== undefined) startupProfile.foundedDate = foundedDate;
        if (location !== undefined) startupProfile.location = location;
        if (size !== undefined) startupProfile.size = size;
        if (stage !== undefined) startupProfile.stage = stage;
        if (fundingStage !== undefined) startupProfile.fundingStage = fundingStage;
        if (mission !== undefined) startupProfile.mission = mission;
        if (vision !== undefined) startupProfile.vision = vision;
        if (values !== undefined) startupProfile.values = values;
        if (tags !== undefined) startupProfile.tags = tags;
        if (teamSize !== undefined) startupProfile.teamSize = teamSize;

        // Update contact info
        if (contactInfo !== undefined) {
            startupProfile.contactInfo = { ...startupProfile.contactInfo, ...contactInfo };
        }

        // Update social media
        if (socialMedia !== undefined) {
            startupProfile.socialMedia = { ...startupProfile.socialMedia, ...socialMedia };
        }

        // Update products
        if (products !== undefined) startupProfile.products = products;

        await startupProfile.save();

        res.json({
            message: 'Profile updated successfully',
            startupProfile
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update startup journey
// @route   PUT /api/startups/journey
// @access  Protected (Startup)
exports.updateJourney = async (req, res) => {
    try {
        const { story, milestones, achievements } = req.body;

        // Use _id for consistency with Mongoose
        const userId = req.user._id || req.user.id;

        // Check user role first
        if (req.user.role !== 'Startup') {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized. Only Startup users can update journey.`,
                code: 'INVALID_ROLE',
                userRole: req.user.role
            });
        }

        console.log('Update journey request - User ID:', userId);
        console.log('Update journey request - User role:', req.user.role);

        const startupProfile = await StartupProfile.findOne({ userId: userId });

        if (!startupProfile) {
            console.log('No startup profile found for user:', userId);
            // Check if user exists and has startupProfileId set
            const User = require('../models/User');
            const user = await User.findById(userId);
            
            return res.status(404).json({ 
                message: 'Startup profile not found. Please complete your startup registration.',
                code: 'PROFILE_NOT_FOUND',
                userId: userId.toString(),
                userRole: req.user.role,
                hasStartupProfileId: !!user?.startupProfileId,
                suggestion: 'If you just registered, there may have been an issue during profile creation. Please contact support or try registering again.'
            });
        }

        console.log('Startup profile found:', startupProfile._id);

        // Initialize journey if it doesn't exist
        if (!startupProfile.journey) {
            startupProfile.journey = {
                milestones: [],
                achievements: []
            };
        }

        if (story !== undefined) startupProfile.journey.story = story;
        if (milestones !== undefined) startupProfile.journey.milestones = milestones;
        if (achievements !== undefined) startupProfile.journey.achievements = achievements;

        await startupProfile.save();

        res.json({
            message: 'Journey updated successfully',
            journey: startupProfile.journey
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add journey milestone
// @route   POST /api/startups/journey/milestones
// @access  Protected (Startup)
exports.addMilestone = async (req, res) => {
    try {
        const { title, description, date, type } = req.body;

        if (!title || !date) {
            return res.status(400).json({ message: 'Title and date are required' });
        }

        const startupProfile = await StartupProfile.findOne({ userId: req.user.id });

        if (!startupProfile) {
            return res.status(404).json({ message: 'Startup profile not found' });
        }

        // Initialize journey if it doesn't exist
        if (!startupProfile.journey) {
            startupProfile.journey = {
                milestones: [],
                achievements: []
            };
        }
        if (!startupProfile.journey.milestones) {
            startupProfile.journey.milestones = [];
        }

        startupProfile.journey.milestones.push({
            title,
            description,
            date,
            type: type || 'Milestone'
        });

        await startupProfile.save();

        res.status(201).json({
            message: 'Milestone added successfully',
            milestone: startupProfile.journey.milestones[startupProfile.journey.milestones.length - 1]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add achievement
// @route   POST /api/startups/journey/achievements
// @access  Protected (Startup)
exports.addAchievement = async (req, res) => {
    try {
        const { title, description, date } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const startupProfile = await StartupProfile.findOne({ userId: req.user.id });

        if (!startupProfile) {
            return res.status(404).json({ message: 'Startup profile not found' });
        }

        // Initialize journey if it doesn't exist
        if (!startupProfile.journey) {
            startupProfile.journey = {
                milestones: [],
                achievements: []
            };
        }
        if (!startupProfile.journey.achievements) {
            startupProfile.journey.achievements = [];
        }

        startupProfile.journey.achievements.push({
            title,
            description,
            date: date || new Date()
        });

        await startupProfile.save();

        res.status(201).json({
            message: 'Achievement added successfully',
            achievement: startupProfile.journey.achievements[startupProfile.journey.achievements.length - 1]
        });

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
        const startups = await StartupProfile.find({ isDomainVerified: true })
            .populate('userId', 'name email role')
            .select('-journey.milestones -journey.achievements'); // Exclude detailed journey for list view
        res.json(startups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get startup by ID (public view)
// @route   GET /api/startups/:id
// @access  Public/Protected
exports.getStartupById = async (req, res) => {
    try {
        const startupProfile = await StartupProfile.findById(req.params.id)
            .populate('userId', 'name email role');

        if (!startupProfile) {
            return res.status(404).json({ message: 'Startup not found' });
        }

        res.json(startupProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save everything in one click (Profile + Journey)
// @route   POST /api/startups/save-all
// @access  Protected (Startup)
exports.saveAll = async (req, res) => {
    try {
        const {
            // Profile fields
            companyName,
            website,
            description,
            logo,
            industry,
            foundedDate,
            location,
            size,
            stage,
            fundingStage,
            mission,
            vision,
            values,
            tags,
            contactInfo,
            socialMedia,
            products,
            teamSize,
            // Journey fields
            journey
        } = req.body;

        const startupProfile = await StartupProfile.findOne({ userId: req.user.id });

        if (!startupProfile) {
            return res.status(404).json({ message: 'Startup profile not found' });
        }

        // Update profile fields
        if (companyName !== undefined) startupProfile.companyName = companyName;
        if (website !== undefined) startupProfile.website = website;
        if (description !== undefined) startupProfile.description = description;
        if (logo !== undefined) startupProfile.logo = logo;
        if (industry !== undefined) startupProfile.industry = industry;
        if (foundedDate !== undefined) startupProfile.foundedDate = foundedDate;
        if (location !== undefined) startupProfile.location = location;
        if (size !== undefined) startupProfile.size = size;
        if (stage !== undefined) startupProfile.stage = stage;
        if (fundingStage !== undefined) startupProfile.fundingStage = fundingStage;
        if (mission !== undefined) startupProfile.mission = mission;
        if (vision !== undefined) startupProfile.vision = vision;
        if (values !== undefined) startupProfile.values = values;
        if (tags !== undefined) startupProfile.tags = tags;
        if (teamSize !== undefined) startupProfile.teamSize = teamSize;
        if (products !== undefined) startupProfile.products = products;

        // Update contact info
        if (contactInfo !== undefined) {
            startupProfile.contactInfo = { ...startupProfile.contactInfo, ...contactInfo };
        }

        // Update social media
        if (socialMedia !== undefined) {
            startupProfile.socialMedia = { ...startupProfile.socialMedia, ...socialMedia };
        }

        // Update journey
        if (journey !== undefined) {
            if (!startupProfile.journey) {
                startupProfile.journey = {
                    milestones: [],
                    achievements: []
                };
            }
            if (journey.story !== undefined) startupProfile.journey.story = journey.story;
            if (journey.milestones !== undefined) startupProfile.journey.milestones = journey.milestones;
            if (journey.achievements !== undefined) startupProfile.journey.achievements = journey.achievements;
        }

        await startupProfile.save();

        res.json({
            message: 'All data saved successfully',
            startupProfile
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete startup profile
// @route   DELETE /api/startups/profile
// @access  Protected (Startup)
exports.deleteProfile = async (req, res) => {
    try {
        const startupProfile = await StartupProfile.findOne({ userId: req.user.id });

        if (!startupProfile) {
            return res.status(404).json({ message: 'Startup profile not found' });
        }

        // Also delete associated team if exists
        const team = await Team.findOne({ leaderId: req.user.id });
        if (team) {
            await Team.findByIdAndDelete(team._id);
        }

        // Delete the startup profile
        await StartupProfile.findByIdAndDelete(startupProfile._id);

        // Update user to remove startupProfileId reference
        const user = await User.findById(req.user.id);
        if (user) {
            user.startupProfileId = undefined;
            user.teamId = undefined;
            await user.save();
        }

        res.json({
            message: 'Startup profile deleted successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Show company (public display)
// @route   GET /api/startups/show/:id
// @access  Public
exports.showCompany = async (req, res) => {
    try {
        const startupProfile = await StartupProfile.findById(req.params.id)
            .populate('userId', 'name email role');

        if (!startupProfile) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Return formatted company display data
        res.json({
            success: true,
            company: {
                id: startupProfile._id,
                companyName: startupProfile.companyName,
                website: startupProfile.website,
                description: startupProfile.description,
                logo: startupProfile.logo,
                industry: startupProfile.industry,
                foundedDate: startupProfile.foundedDate,
                location: startupProfile.location,
                size: startupProfile.size,
                stage: startupProfile.stage,
                fundingStage: startupProfile.fundingStage,
                mission: startupProfile.mission,
                vision: startupProfile.vision,
                values: startupProfile.values,
                tags: startupProfile.tags,
                contactInfo: startupProfile.contactInfo,
                socialMedia: startupProfile.socialMedia,
                products: startupProfile.products,
                teamSize: startupProfile.teamSize,
                journey: startupProfile.journey,
                isDomainVerified: startupProfile.isDomainVerified,
                owner: {
                    name: startupProfile.userId?.name,
                    email: startupProfile.userId?.email
                },
                createdAt: startupProfile.createdAt,
                updatedAt: startupProfile.updatedAt
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
