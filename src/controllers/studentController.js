const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Protected (Student)
exports.getProfile = async (req, res) => {
    try {
        const studentProfile = await StudentProfile.findOne({ userId: req.user.id })
            .populate('userId', 'name email role isVerified verificationBadge');

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        res.json(studentProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create student profile
// @route   POST /api/students/profile
// @access  Protected (Student)
exports.createProfile = async (req, res) => {
    try {
        // Check if profile already exists
        const existingProfile = await StudentProfile.findOne({ userId: req.user.id });
        if (existingProfile) {
            return res.status(400).json({ message: 'Profile already exists. Use PUT to update.' });
        }

        const profileData = {
            userId: req.user.id,
            ...req.body
        };

        const studentProfile = await StudentProfile.create(profileData);

        // Link profile to user
        const user = await User.findById(req.user.id);
        if (user) {
            user.studentProfileId = studentProfile._id;
            await user.save();
        }

        res.status(201).json({
            message: 'Student profile created successfully',
            studentProfile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Protected (Student)
exports.updateProfile = async (req, res) => {
    try {
        const studentProfile = await StudentProfile.findOne({ userId: req.user.id });

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Update fields
        const updateFields = [
            'bio', 'dateOfBirth', 'phone', 'location', 'profilePicture',
            'schoolEmail', 'schoolName', 'studentId', 'major', 'yearOfStudy',
            'graduationDate', 'gpa', 'education', 'experience', 'projects',
            'skills', 'interests', 'careerGoals', 'lookingFor', 'socialMedia',
            'languages', 'certifications', 'awards', 'availability', 'resumeUrl', 'tags'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                studentProfile[field] = req.body[field];
            }
        });

        await studentProfile.save();

        res.json({
            message: 'Profile updated successfully',
            studentProfile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete student profile
// @route   DELETE /api/students/profile
// @access  Protected (Student)
exports.deleteProfile = async (req, res) => {
    try {
        const studentProfile = await StudentProfile.findOne({ userId: req.user.id });

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Remove profile reference from user
        const user = await User.findById(req.user.id);
        if (user) {
            user.studentProfileId = undefined;
            await user.save();
        }

        // Delete the profile
        await StudentProfile.findByIdAndDelete(studentProfile._id);

        res.json({
            message: 'Student profile deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add education entry
// @route   POST /api/students/profile/education
// @access  Protected (Student)
exports.addEducation = async (req, res) => {
    try {
        const { institution, degree, fieldOfStudy, startDate, endDate, isCurrent, description } = req.body;

        if (!institution) {
            return res.status(400).json({ message: 'Institution is required' });
        }

        const studentProfile = await StudentProfile.findOne({ userId: req.user.id });

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        if (!studentProfile.education) {
            studentProfile.education = [];
        }

        studentProfile.education.push({
            institution,
            degree,
            fieldOfStudy,
            startDate,
            endDate,
            isCurrent: isCurrent || false,
            description
        });

        await studentProfile.save();

        res.status(201).json({
            message: 'Education added successfully',
            education: studentProfile.education[studentProfile.education.length - 1]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add experience entry
// @route   POST /api/students/profile/experience
// @access  Protected (Student)
exports.addExperience = async (req, res) => {
    try {
        const { title, company, location, startDate, endDate, isCurrent, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const studentProfile = await StudentProfile.findOne({ userId: req.user.id });

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        if (!studentProfile.experience) {
            studentProfile.experience = [];
        }

        studentProfile.experience.push({
            title,
            company,
            location,
            startDate,
            endDate,
            isCurrent: isCurrent || false,
            description
        });

        await studentProfile.save();

        res.status(201).json({
            message: 'Experience added successfully',
            experience: studentProfile.experience[studentProfile.experience.length - 1]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add project
// @route   POST /api/students/profile/projects
// @access  Protected (Student)
exports.addProject = async (req, res) => {
    try {
        const { name, description, technologies, startDate, endDate, url, githubUrl } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const studentProfile = await StudentProfile.findOne({ userId: req.user.id });

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        if (!studentProfile.projects) {
            studentProfile.projects = [];
        }

        studentProfile.projects.push({
            name,
            description,
            technologies,
            startDate,
            endDate,
            url,
            githubUrl
        });

        await studentProfile.save();

        res.status(201).json({
            message: 'Project added successfully',
            project: studentProfile.projects[studentProfile.projects.length - 1]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add skill
// @route   POST /api/students/profile/skills
// @access  Protected (Student)
exports.addSkill = async (req, res) => {
    try {
        const { name, level, category } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Skill name is required' });
        }

        const studentProfile = await StudentProfile.findOne({ userId: req.user.id });

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        if (!studentProfile.skills) {
            studentProfile.skills = [];
        }

        // Check if skill already exists
        const existingSkill = studentProfile.skills.find(skill => skill.name.toLowerCase() === name.toLowerCase());
        if (existingSkill) {
            return res.status(400).json({ message: 'Skill already exists' });
        }

        studentProfile.skills.push({
            name,
            level: level || 'Intermediate',
            category: category || 'Technical'
        });

        await studentProfile.save();

        res.status(201).json({
            message: 'Skill added successfully',
            skill: studentProfile.skills[studentProfile.skills.length - 1]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all students (public)
// @route   GET /api/students
// @access  Protected
exports.getAllStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, major, yearOfStudy, skills } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { bio: { $regex: search, $options: 'i' } },
                { schoolName: { $regex: search, $options: 'i' } },
                { major: { $regex: search, $options: 'i' } }
            ];
        }
        if (major) query.major = major;
        if (yearOfStudy) query.yearOfStudy = yearOfStudy;
        if (skills) {
            query['skills.name'] = { $in: Array.isArray(skills) ? skills : [skills] };
        }

        const students = await StudentProfile.find(query)
            .populate('userId', 'name email role isVerified verificationBadge')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-education -experience -projects -certifications -awards'); // Exclude detailed info for list view

        const total = await StudentProfile.countDocuments(query);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            students
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get student by ID (public view)
// @route   GET /api/students/:id
// @access  Protected
exports.getStudentById = async (req, res) => {
    try {
        const studentProfile = await StudentProfile.findById(req.params.id)
            .populate('userId', 'name email role isVerified verificationBadge');

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(studentProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

