const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/posts');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `post-${uniqueSuffix}${ext}`;
        cb(null, filename);
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    // Accept images only
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 5 // Maximum 5 images per post
    }
});

// Middleware for multiple images
const uploadPostImages = upload.array('images', 5);

// Helper function to get file URL
const getFileUrl = (req, filename) => {
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/uploads/posts/${filename}`;
};

module.exports = {
    uploadPostImages,
    getFileUrl
};

