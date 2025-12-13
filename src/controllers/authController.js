const User = require('../models/User');
const StartupProfile = require('../models/StartupProfile');
const StudentProfile = require('../models/StudentProfile');
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

        // Handle Student specifics
        if (role === 'Student') {
            // Create an empty student profile for the student
            const studentProfile = await StudentProfile.create({
                userId: user._id
            });

            user.studentProfileId = studentProfile._id;
            await user.save();
        }

        // Send welcome and verification email
        const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
        
        const { createWelcomeEmailHTML } = require('../utils/nodemailer_config');
        
        // Create welcome email content
        const welcomeSubject = `Welcome to StartConnect, ${name}! 🎉`;
        const welcomeHTML = createWelcomeEmailHTML(name, role, verificationUrl);
        const welcomeText = `
Welcome to StartConnect, ${name}!

We're thrilled to have you join our community! Your account has been successfully created.

As a ${role} on StartConnect, you can:
${role === 'Startup' 
    ? '- Showcase your company and journey\n- Connect with talented students\n- Post opportunities and updates\n- Build your team'
    : '- Complete your profile with skills and experience\n- Discover exciting startup opportunities\n- Connect with innovative companies\n- Build your professional network'
}

Next Step: Please verify your email address to get started.

Verification Link: ${verificationUrl}

If you have any questions, feel free to reach out to our support team.

Best regards,
The StartConnect Team
        `;

        // Send welcome email
        try {
            await sendEmail(email, welcomeSubject, welcomeText, welcomeHTML);
            console.log(`Welcome email sent to ${email}`);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Continue with registration even if email fails
        }

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
            message: 'Registration successful! Welcome email sent.'
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
