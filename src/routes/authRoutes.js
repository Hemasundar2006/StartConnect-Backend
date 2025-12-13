const express = require('express');
const router = express.Router();
const { register, login, verifyEmail } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validationMiddleware');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/verify-email', verifyEmail); // Can be GET too, but prompt said POST

module.exports = router;
