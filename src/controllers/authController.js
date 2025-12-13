const User = require('../models/User');
const StartupProfile = require('../models/StartupProfile');
const Team = require('../models/Team');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/nodemailer_config');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, companyName, website } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(20).toString('hex');

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            verificationToken,
            verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        // Handle Startup specifics
        if (role === 'Startup') {
            // Domain check logic
            // Extract domain from website: https://example.com -> example.com
            // This is a simplified check.
            let domain = '';
            try {
                const url = new URL(website.startsWith('http') ? website : `https://${website}`);
                domain = url.hostname.replace('www.', '');
            } catch (e) {
                // Invalid URL, might want to handle better
                console.log('Invalid URL provided');
            }

            const emailDomain = email.split('@')[1];
            const isDomainVerified = domain && emailDomain && (domain === emailDomain || emailDomain.endsWith(domain));

            const startupProfile = await StartupProfile.create({
                userId: user._id,
                companyName,
                website,
                isDomainVerified: !!isDomainVerified
            });

            user.startupProfileId = startupProfile._id;

            // Create a Team for the startup leader
            const team = await Team.create({
                leaderId: user._id,
                companyId: startupProfile._id,
                members: [user._id]
            });
            user.teamId = team._id;

            await user.save();
        }

        // Send verification email
        const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
        const message = `Please verify your email by clicking on the link: ${verificationUrl}\n\nToken: ${verificationToken}`;

        // await sendEmail(email, 'Email Verification', message); // Commented out to prevent errors without env setup

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
            details: 'Verification email sent (simulated). Check console/logs in real app.'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body; // Or req.params if using GET/Link

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;

        // Check for Badge Assignment
        if (user.role === 'Student') {
            // Basic check: if school email? For now just verify.
            user.verificationBadge.push('Verified Student');
        } else if (user.role === 'Startup') {
            // Check if domain was verified
            const startup = await StartupProfile.findById(user.startupProfileId);
            if (startup && startup.isDomainVerified) {
                user.verificationBadge.push('Verified Company');
            }
        }

        await user.save();

        res.json({ message: 'Email verified successfully', isVerified: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
