const passport = require('passport');

const protect = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        req.user = user;
        next();
    })(req, res, next);
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized to access this route`,
                code: 'INVALID_ROLE',
                userRole: req.user.role,
                requiredRoles: roles,
                userId: req.user._id || req.user.id
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
