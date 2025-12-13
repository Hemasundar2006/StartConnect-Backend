const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // If it's a startup post, it might be good to link to the StartupProfile too, but authorId (User) is sufficient if linked.
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    tags: [String],
    // Images/Photos for the post
    images: [{
        url: {
            type: String,
            required: true,
        },
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
    }],
}, { timestamps: true });

// Pre-save hook to limit posts
postSchema.pre('save', async function (next) {
    if (this.isNew) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const postCount = await mongoose.models.Post.countDocuments({
            authorId: this.authorId,
            createdAt: { $gte: oneWeekAgo }
        });

        // Limit: 3 posts per week
        if (postCount >= 3) {
            const err = new Error('Post limit exceeded. You can only create 3 posts per week.');
            err.status = 429;
            return next(err);
        }
    }
    next();
});

module.exports = mongoose.model('Post', postSchema);
