const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
    institution: {
        type: String,
        required: true,
    },
    degree: {
        type: String,
    },
    fieldOfStudy: {
        type: String,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    isCurrent: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
    },
}, { _id: true });

const experienceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    company: {
        type: String,
    },
    location: {
        type: String,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    isCurrent: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
    },
}, { _id: true });

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    technologies: [{
        type: String,
    }],
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    url: {
        type: String,
    },
    githubUrl: {
        type: String,
    },
}, { _id: true });

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Intermediate',
    },
    category: {
        type: String,
        enum: ['Technical', 'Soft Skills', 'Language', 'Other'],
        default: 'Technical',
    },
}, { _id: true });

const studentProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Personal Information
    bio: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    phone: {
        type: String,
    },
    location: {
        city: String,
        state: String,
        country: String,
    },
    profilePicture: {
        type: String,
    },
    
    // Academic Information
    schoolEmail: {
        type: String,
    },
    schoolName: {
        type: String,
    },
    studentId: {
        type: String,
    },
    major: {
        type: String,
    },
    yearOfStudy: {
        type: String,
        enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other'],
    },
    graduationDate: {
        type: Date,
    },
    gpa: {
        type: Number,
        min: 0,
        max: 4.0,
    },
    
    // Education History
    education: {
        type: [educationSchema],
        default: [],
    },
    
    // Experience
    experience: {
        type: [experienceSchema],
        default: [],
    },
    
    // Projects
    projects: {
        type: [projectSchema],
        default: [],
    },
    
    // Skills
    skills: {
        type: [skillSchema],
        default: [],
    },
    
    // Interests & Goals
    interests: [{
        type: String,
    }],
    careerGoals: {
        type: String,
    },
    lookingFor: {
        type: [String],
        enum: ['Internship', 'Full-time', 'Part-time', 'Freelance', 'Startup Opportunity', 'Mentorship'],
    },
    
    // Social Media & Links
    socialMedia: {
        linkedin: String,
        github: String,
        portfolio: String,
        twitter: String,
        personalWebsite: String,
    },
    
    // Additional Information
    languages: [{
        name: String,
        proficiency: {
            type: String,
            enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
        },
    }],
    certifications: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        credentialUrl: String,
    }],
    awards: [{
        title: String,
        description: String,
        date: Date,
        issuer: String,
    }],
    
    // Availability
    availability: {
        type: String,
        enum: ['Available', 'Busy', 'Not Available'],
        default: 'Available',
    },
    
    // Resume/CV
    resumeUrl: {
        type: String,
    },
    
    // Tags for searchability
    tags: [{
        type: String,
    }],
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);

