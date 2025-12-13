const Post = require('../models/Post');

// @desc    Get all approved posts
// @route   GET /api/feed/posts
// @access  Protected (Student)
exports.getFeedPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const query = { isApproved: true };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const posts = await Post.find(query)
            .populate('authorId', 'name email verificationBadge')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Post.countDocuments(query);

        res.json({
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
