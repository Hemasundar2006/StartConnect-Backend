const express = require('express');
const router = express.Router();
const {
    createPost,
    inviteTeamMember,
    acceptInvitation,
    getProfile,
    updateProfile,
    updateJourney,
    addMilestone,
    addAchievement,
    getStartups,
    getStartupById,
    saveAll,
    deleteProfile,
    showCompany
} = require('../controllers/startupController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { postLimiter } = require('../middlewares/rateLimiter');
const { uploadPostImages } = require('../middlewares/uploadMiddleware');
const {
    validateUpdateProfile,
    validateUpdateJourney,
    validateMilestone,
    validateAchievement,
    validateSaveAll,
    validateInviteEmail
} = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', protect, getStartups);
router.get('/show/:id', showCompany); // Public company display
router.get('/teams/accept-invitation', acceptInvitation); // Public invitation acceptance

// Startup specific routes (protected)
router.get('/profile/me', protect, authorize('Startup'), getProfile);
router.put('/profile', protect, authorize('Startup'), validateUpdateProfile, updateProfile);
router.delete('/profile', protect, authorize('Startup'), deleteProfile);
router.post('/save-all', protect, authorize('Startup'), validateSaveAll, saveAll);
router.post('/posts', protect, authorize('Startup'), postLimiter, uploadPostImages, createPost);
router.post('/teams/invite', protect, authorize('Startup'), validateInviteEmail, inviteTeamMember);

// Journey routes
router.put('/journey', protect, authorize('Startup'), validateUpdateJourney, updateJourney);
router.post('/journey/milestones', protect, authorize('Startup'), validateMilestone, addMilestone);
router.post('/journey/achievements', protect, authorize('Startup'), validateAchievement, addAchievement);

// Public route - must be last to avoid conflicts with specific routes
router.get('/:id', protect, getStartupById);

module.exports = router;
