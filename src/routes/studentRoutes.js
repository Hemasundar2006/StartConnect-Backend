const express = require('express');
const router = express.Router();
const {
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    addEducation,
    addExperience,
    addProject,
    addSkill,
    getAllStudents,
    getStudentById
} = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    validateStudentProfile,
    validateEducation,
    validateExperience,
    validateProject,
    validateSkill
} = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', protect, getAllStudents);

// Student specific routes (protected) - must come before /:id route
router.get('/profile/me', protect, authorize('Student'), getProfile);
router.post('/profile', protect, authorize('Student'), validateStudentProfile, createProfile);
router.put('/profile', protect, authorize('Student'), validateStudentProfile, updateProfile);
router.delete('/profile', protect, authorize('Student'), deleteProfile);

// Additional profile sections
router.post('/profile/education', protect, authorize('Student'), validateEducation, addEducation);
router.post('/profile/experience', protect, authorize('Student'), validateExperience, addExperience);
router.post('/profile/projects', protect, authorize('Student'), validateProject, addProject);
router.post('/profile/skills', protect, authorize('Student'), validateSkill, addSkill);

// Public route - must be last to avoid conflicts with specific routes
router.get('/:id', protect, getStudentById);

module.exports = router;

