const Post = require('../models/Post');
const ModerationLog = require('../models/ModerationLog');

// @desc    Get pending posts
// @route   GET /api/admin/posts/pending
// @access  Private (Admin)
exports.getPendingPosts = async (req, res) => {
    try {
        const posts = await Post.find({ isApproved: false }).populate('authorId', 'name email');
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve a post
// @route   PUT /api/admin/posts/:postId/approve
// @access  Private (Admin)
exports.approvePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.isApproved = true;
        await post.save();

        // Log action
        await ModerationLog.create({
            adminId: req.user.id,
            postId: post._id,
            action: 'APPROVE_POST',
            details: 'Post approved by admin'
        });

        res.json({ message: 'Post approved', post });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Log moderation action
// @route   POST /api/admin/moderation/log
// @access  Private (Admin)
exports.logModeration = async (req, res) => {
    try {
        const { postId, action, details } = req.body;

        const log = await ModerationLog.create({
            adminId: req.user.id,
            postId,
            action,
            details
        });

        res.status(201).json(log);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
