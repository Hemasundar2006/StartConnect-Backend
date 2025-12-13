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

module.exports = { validateRegister, validateLogin };
