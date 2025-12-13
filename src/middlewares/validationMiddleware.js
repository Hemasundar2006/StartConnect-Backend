const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('Student', 'Startup').required(),
    // Specific fields based on logic can be added here or handled in controller
    companyName: Joi.string().when('role', { is: 'Startup', then: Joi.required() }),
    website: Joi.string().uri().when('role', { is: 'Startup', then: Joi.required() }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const validateRegister = (req, res, next) => {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const updateProfileSchema = Joi.object({
    companyName: Joi.string(),
    website: Joi.string().uri(),
    description: Joi.string(),
    logo: Joi.string().uri().allow(''),
    industry: Joi.string(),
    foundedDate: Joi.date(),
    location: Joi.object({
        city: Joi.string(),
        state: Joi.string(),
        country: Joi.string(),
    }),
    size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '500+'),
    stage: Joi.string().valid('Idea', 'MVP', 'Early Stage', 'Growth', 'Scale', 'Mature'),
    fundingStage: Joi.string().valid('Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO'),
    mission: Joi.string(),
    vision: Joi.string(),
    values: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()),
    contactInfo: Joi.object({
        email: Joi.string().email(),
        phone: Joi.string(),
        address: Joi.string(),
    }),
    socialMedia: Joi.object({
        linkedin: Joi.string().uri().allow(''),
        twitter: Joi.string().uri().allow(''),
        facebook: Joi.string().uri().allow(''),
        instagram: Joi.string().uri().allow(''),
        github: Joi.string().uri().allow(''),
    }),
    products: Joi.array().items(Joi.object({
        name: Joi.string(),
        description: Joi.string(),
    })),
    teamSize: Joi.number().integer().min(1),
});

const updateJourneySchema = Joi.object({
    story: Joi.string(),
    milestones: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        date: Joi.date().required(),
        type: Joi.string().valid('Launch', 'Funding', 'Partnership', 'Achievement', 'Milestone', 'Other'),
    })),
    achievements: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        date: Joi.date(),
    })),
});

const milestoneSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    date: Joi.date().required(),
    type: Joi.string().valid('Launch', 'Funding', 'Partnership', 'Achievement', 'Milestone', 'Other'),
});

const achievementSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    date: Joi.date(),
});

const saveAllSchema = Joi.object({
    // Profile fields
    companyName: Joi.string(),
    website: Joi.string().uri(),
    description: Joi.string(),
    logo: Joi.string().uri().allow(''),
    industry: Joi.string(),
    foundedDate: Joi.date(),
    location: Joi.object({
        city: Joi.string(),
        state: Joi.string(),
        country: Joi.string(),
    }),
    size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '500+'),
    stage: Joi.string().valid('Idea', 'MVP', 'Early Stage', 'Growth', 'Scale', 'Mature'),
    fundingStage: Joi.string().valid('Bootstrapped', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO'),
    mission: Joi.string(),
    vision: Joi.string(),
    values: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()),
    contactInfo: Joi.object({
        email: Joi.string().email(),
        phone: Joi.string(),
        address: Joi.string(),
    }),
    socialMedia: Joi.object({
        linkedin: Joi.string().uri().allow(''),
        twitter: Joi.string().uri().allow(''),
        facebook: Joi.string().uri().allow(''),
        instagram: Joi.string().uri().allow(''),
        github: Joi.string().uri().allow(''),
    }),
    products: Joi.array().items(Joi.object({
        name: Joi.string(),
        description: Joi.string(),
    })),
    teamSize: Joi.number().integer().min(1),
    // Journey fields
    journey: Joi.object({
        story: Joi.string(),
        milestones: Joi.array().items(Joi.object({
            title: Joi.string().required(),
            description: Joi.string(),
            date: Joi.date().required(),
            type: Joi.string().valid('Launch', 'Funding', 'Partnership', 'Achievement', 'Milestone', 'Other'),
        })),
        achievements: Joi.array().items(Joi.object({
            title: Joi.string().required(),
            description: Joi.string(),
            date: Joi.date(),
        })),
    }),
});

const validateUpdateProfile = (req, res, next) => {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateUpdateJourney = (req, res, next) => {
    const { error } = updateJourneySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateMilestone = (req, res, next) => {
    const { error } = milestoneSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateAchievement = (req, res, next) => {
    const { error } = achievementSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateSaveAll = (req, res, next) => {
    const { error } = saveAllSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const inviteEmailSchema = Joi.object({
    email: Joi.string().email().required(),
});

const validateInviteEmail = (req, res, next) => {
    const { error } = inviteEmailSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

// Student Profile Validation Schemas
const studentProfileSchema = Joi.object({
    bio: Joi.string(),
    dateOfBirth: Joi.date(),
    phone: Joi.string(),
    location: Joi.object({
        city: Joi.string(),
        state: Joi.string(),
        country: Joi.string(),
    }),
    profilePicture: Joi.string().uri().allow(''),
    schoolEmail: Joi.string().email(),
    schoolName: Joi.string(),
    studentId: Joi.string(),
    major: Joi.string(),
    yearOfStudy: Joi.string().valid('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other'),
    graduationDate: Joi.date(),
    gpa: Joi.number().min(0).max(4.0),
    education: Joi.array().items(Joi.object({
        institution: Joi.string().required(),
        degree: Joi.string(),
        fieldOfStudy: Joi.string(),
        startDate: Joi.date(),
        endDate: Joi.date(),
        isCurrent: Joi.boolean(),
        description: Joi.string(),
    })),
    experience: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        company: Joi.string(),
        location: Joi.string(),
        startDate: Joi.date(),
        endDate: Joi.date(),
        isCurrent: Joi.boolean(),
        description: Joi.string(),
    })),
    projects: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        description: Joi.string(),
        technologies: Joi.array().items(Joi.string()),
        startDate: Joi.date(),
        endDate: Joi.date(),
        url: Joi.string().uri().allow(''),
        githubUrl: Joi.string().uri().allow(''),
    })),
    skills: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert'),
        category: Joi.string().valid('Technical', 'Soft Skills', 'Language', 'Other'),
    })),
    interests: Joi.array().items(Joi.string()),
    careerGoals: Joi.string(),
    lookingFor: Joi.array().items(Joi.string().valid('Internship', 'Full-time', 'Part-time', 'Freelance', 'Startup Opportunity', 'Mentorship')),
    socialMedia: Joi.object({
        linkedin: Joi.string().uri().allow(''),
        github: Joi.string().uri().allow(''),
        portfolio: Joi.string().uri().allow(''),
        twitter: Joi.string().uri().allow(''),
        personalWebsite: Joi.string().uri().allow(''),
    }),
    languages: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        proficiency: Joi.string().valid('Basic', 'Conversational', 'Fluent', 'Native'),
    })),
    certifications: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        issuer: Joi.string(),
        issueDate: Joi.date(),
        expiryDate: Joi.date(),
        credentialId: Joi.string(),
        credentialUrl: Joi.string().uri().allow(''),
    })),
    awards: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        date: Joi.date(),
        issuer: Joi.string(),
    })),
    availability: Joi.string().valid('Available', 'Busy', 'Not Available'),
    resumeUrl: Joi.string().uri().allow(''),
    tags: Joi.array().items(Joi.string()),
});

const educationSchema = Joi.object({
    institution: Joi.string().required(),
    degree: Joi.string(),
    fieldOfStudy: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    isCurrent: Joi.boolean(),
    description: Joi.string(),
});

const experienceSchema = Joi.object({
    title: Joi.string().required(),
    company: Joi.string(),
    location: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    isCurrent: Joi.boolean(),
    description: Joi.string(),
});

const projectSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    technologies: Joi.array().items(Joi.string()),
    startDate: Joi.date(),
    endDate: Joi.date(),
    url: Joi.string().uri().allow(''),
    githubUrl: Joi.string().uri().allow(''),
});

const skillSchema = Joi.object({
    name: Joi.string().required(),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert'),
    category: Joi.string().valid('Technical', 'Soft Skills', 'Language', 'Other'),
});

const validateStudentProfile = (req, res, next) => {
    const { error } = studentProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateEducation = (req, res, next) => {
    const { error } = educationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateExperience = (req, res, next) => {
    const { error } = experienceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateProject = (req, res, next) => {
    const { error } = projectSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

const validateSkill = (req, res, next) => {
    const { error } = skillSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateUpdateJourney,
    validateMilestone,
    validateAchievement,
    validateSaveAll,
    validateInviteEmail,
    validateStudentProfile,
    validateEducation,
    validateExperience,
    validateProject,
    validateSkill,
};
