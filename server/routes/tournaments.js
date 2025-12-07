const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Tournament = require('../models/Tournament');
const User = require('../models/User');

// @route   GET api/tournaments
// @desc    Get all tournaments
// @access  Public
router.get('/', async (req, res) => {
    try {
        const tournaments = await Tournament.find().sort({ date: -1 });
        res.json(tournaments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tournaments
// @desc    Create a tournament
// @access  Admin
router.post('/', [auth, admin], async (req, res) => {
    const { title, type, entryFee, prizePool, schedule, maxPlayers } = req.body;
    try {
        const newTournament = new Tournament({
            title,
            type,
            entryFee,
            prizePool,
            schedule,
            maxPlayers
        });
        const tournament = await newTournament.save();
        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tournaments/:id/join
// @desc    Join a tournament
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        const user = await User.findById(req.user.id);

        if (!tournament) return res.status(404).json({ msg: 'Tournament not found' });

        // Check if user already joined
        const isJoined = tournament.participants.some(p => p.user.toString() === req.user.id);
        if (isJoined) {
            return res.status(400).json({ msg: 'Already joined this tournament' });
        }

        // Check availability
        if (tournament.participants.length >= tournament.maxPlayers) {
            return res.status(400).json({ msg: 'Tournament is full' });
        }

        // UPI Check
        const { upiId } = req.body;
        if (tournament.entryFee > 0 && !upiId) {
            return res.status(400).json({ msg: 'UPI ID is required' });
        }

        // Add user
        tournament.participants.unshift({
            user: req.user.id,
            upiId: upiId || ''
        });
        await tournament.save();

        // Add to user's list
        user.tournamentsJoined.unshift(tournament.id);
        await user.save();

        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/tournaments/:id
// @desc    Get single tournament details
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('participants.user', 'name ffUid')
            .populate('messages.sender', 'name role');
        if (!tournament) return res.status(404).json({ msg: 'Not Found' });
        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/tournaments/:id/status
// @desc    Update Status (Lifecycle)
// @access  Admin
router.patch('/:id/status', [auth, admin], async (req, res) => {
    const { status, startTime, endTime } = req.body;
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Not Found' });

        if (status) tournament.status = status;
        if (startTime) tournament.startTime = startTime;
        if (endTime) tournament.endTime = endTime;

        await tournament.save();
        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tournaments/:id/declare-winners
// @desc    Declare Winners
// @access  Admin
router.post('/:id/declare-winners', [auth, admin], async (req, res) => {
    const { winners } = req.body;
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Not Found' });

        tournament.winners = winners;
        tournament.status = 'Completed';
        tournament.endTime = Date.now();

        await tournament.save();
        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tournaments/:id/chat-toggle
// @desc    Toggle Chat
// @access  Admin
router.put('/:id/chat-toggle', [auth, admin], async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        tournament.chatEnabled = !tournament.chatEnabled;
        await tournament.save();
        res.json(tournament);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tournaments/:id/chat
// @desc    Send Message
// @access  Private
router.post('/:id/chat', auth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        const user = await User.findById(req.user.id);

        const isParticipant = tournament.participants.some(p => p.user.toString() === req.user.id);
        const isAdmin = user.role === 'admin' || user.role === 'sub-admin';

        if (!isAdmin && !isParticipant) return res.status(401).json({ msg: 'Not Authorized' });
        if (!isAdmin && !tournament.chatEnabled) return res.status(400).json({ msg: 'Chat is disabled' });

        const newMessage = {
            sender: user.id,
            senderName: user.name,
            role: user.role,
            text: req.body.text
        };

        tournament.messages.push(newMessage);
        await tournament.save();
        res.json(tournament.messages);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
