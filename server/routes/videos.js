const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Video = require('../models/Video');

// @route   GET api/videos
// @desc    Get all videos
// @access  Public
router.get('/', async (req, res) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        res.json(videos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/videos
// @desc    Add a video
// @access  Admin
router.post('/', [auth, admin], async (req, res) => {
    const { title, youtubeUrl } = req.body;
    try {
        const newVideo = new Video({
            title,
            youtubeUrl,
            addedBy: req.user.id
        });
        const video = await newVideo.save();
        res.json(video);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/videos/:id/like
// @desc    Like a video (Toggle)
// @access  Private
router.put('/:id/like', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        // Check if already liked
        if (video.likes.includes(req.user.id)) {
            // Un-like
            video.likes.pull(req.user.id);
        } else {
            // Add Like, Remove Dislike
            video.likes.push(req.user.id);
            if (video.dislikes.includes(req.user.id)) {
                video.dislikes.pull(req.user.id);
            }
        }

        await video.save();
        res.json({ likes: video.likes, dislikes: video.dislikes });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/videos/:id/dislike
// @desc    Dislike a video (Toggle)
// @access  Private
router.put('/:id/dislike', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        // Check if already disliked
        if (video.dislikes.includes(req.user.id)) {
            // Un-dislike
            video.dislikes.pull(req.user.id);
        } else {
            // Add Dislike, Remove Like
            video.dislikes.push(req.user.id);
            if (video.likes.includes(req.user.id)) {
                video.likes.pull(req.user.id);
            }
        }

        await video.save();
        res.json({ likes: video.likes, dislikes: video.dislikes });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/videos/:id/comment
// @desc    Comment on a video
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const user = await require('../models/User').findById(req.user.id).select('-password');
        const video = await Video.findById(req.params.id);

        const newComment = {
            user: req.user.id,
            name: user.name,
            text: req.body.text
        };

        video.comments.unshift(newComment);
        await video.save();
        res.json(video.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/videos/:id
// @desc    Delete a video
// @access  Admin
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ msg: 'Video not found' });

        await video.deleteOne();
        res.json({ msg: 'Video removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/videos/:id/comment/:comment_id/like
// @desc    Like a comment
// @access  Private
router.put('/:id/comment/:comment_id/like', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        const comment = video.comments.id(req.params.comment_id);

        if (!comment) return res.status(404).json({ msg: 'Comment not found' });

        if (comment.likes.includes(req.user.id)) return res.status(400).json({ msg: 'Already liked' });

        if (comment.dislikes.includes(req.user.id)) comment.dislikes.pull(req.user.id);

        comment.likes.push(req.user.id);
        await video.save();
        res.json(video.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/videos/:id/comment/:comment_id/dislike
// @desc    Dislike a comment
// @access  Private
router.put('/:id/comment/:comment_id/dislike', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        const comment = video.comments.id(req.params.comment_id);

        if (!comment) return res.status(404).json({ msg: 'Comment not found' });

        if (comment.dislikes.includes(req.user.id)) return res.status(400).json({ msg: 'Already disliked' });

        if (comment.likes.includes(req.user.id)) comment.likes.pull(req.user.id);

        comment.dislikes.push(req.user.id);
        await video.save();
        res.json(video.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/videos/:id/comment/:comment_id/reply
// @desc    Reply to a comment
// @access  Private
router.post('/:id/comment/:comment_id/reply', auth, async (req, res) => {
    try {
        const user = await require('../models/User').findById(req.user.id).select('-password');
        const video = await Video.findById(req.params.id);
        const comment = video.comments.id(req.params.comment_id);

        const newReply = {
            user: req.user.id,
            name: user.name,
            text: req.body.text
        };

        comment.replies.push(newReply);
        await video.save();
        res.json(video.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
