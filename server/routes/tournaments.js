const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const admin = require('../middleware/admin');
const superAdmin = require('../middleware/superAdmin');
const Tournament = require('../models/Tournament');
const User = require('../models/User');

// @route   GET api/tournaments
// @desc    Get all tournaments
// @access  Public
router.get('/', async (req, res) => {
    console.log('GET /api/tournaments hit'); // Debug Log
    try {
        const tournaments = await Tournament.find({ approvalStatus: 'approved' })
            .populate('participants.user', 'name ffUid')
            .populate('winners.user', 'name ffUid')
            .sort({ createdAt: -1 }); // Fixed sort specific field

        console.log(`Found ${tournaments.length} tournaments`); // Debug count
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
    const { title, type, entryFee, prizePool, schedule, maxPlayers, prizeDistribution, totalWinners, loserPercent } = req.body;
    try {
        // Auto-approve for everyone
        const approvalStatus = 'approved';

        const newTournament = new Tournament({
            title,
            type,
            entryFee,
            prizePool,
            schedule,
            maxPlayers,
            prizeDistribution,
            totalWinners,
            loserPercent: loserPercent || 0,
            approvalStatus,
            createdBy: req.user.id
        });
        const tournament = await newTournament.save();
        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tournaments/:id/payment/order
// @desc    Create Razorpay Order
// @access  Private
router.post('/:id/payment/order', auth, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Tournament not found' });

        if (tournament.entryFee <= 0) {
            return res.status(400).json({ msg: 'This tournament is free. No payment required.' });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: tournament.entryFee * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${Date.now()}_${req.user.id.slice(0, 6)}`,
            notes: {
                tournamentId: tournament._id.toString(),
                userId: req.user.id
            }
        };

        const order = await instance.orders.create(options);
        res.json({ order, keyId: process.env.RAZORPAY_KEY_ID });

    } catch (err) {
        console.error(err);
        res.status(500).send('Payment Order Creation Failed');
    }
});

// @route   POST api/tournaments/:id/join
// @desc    Join a tournament
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) return res.status(404).json({ msg: 'Not Found' });

        if (tournament.status !== 'Open') {
            return res.status(400).json({ msg: 'Tournament is not open for registration' });
        }

        if (tournament.participants.length >= tournament.maxPlayers) {
            return res.status(400).json({ msg: 'Tournament is full' });
        }

        // Check if already joined
        const isJoined = tournament.participants.some(p => p.user.toString() === req.user.id);
        if (isJoined) {
            return res.status(400).json({ msg: 'Already joined' });
        }

        const { upiId, playerUids, groupName, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        if (tournament.entryFee > 0) {
            if (!upiId) return res.status(400).json({ msg: 'UPI ID is required' });

            // Validate Payment
            if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
                return res.status(400).json({ msg: 'Payment details missing' });
            }

            const body = razorpayOrderId + "|" + razorpayPaymentId;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            if (expectedSignature !== razorpaySignature) {
                return res.status(400).json({ msg: 'Invalid Payment Signature' });
            }
        }

        // Validate Team Size based on Type
        let expectedCount = 1;
        if (tournament.type === 'Duo') expectedCount = 2;
        if (tournament.type === 'Squad') expectedCount = 4;

        if (!playerUids || !Array.isArray(playerUids) || playerUids.length !== expectedCount) {
            return res.status(400).json({ msg: `You must provide exactly ${expectedCount} FF UIDs for ${tournament.type} mode.` });
        }

        // Group Name Validation for Teams
        if ((tournament.type === 'Duo' || tournament.type === 'Squad') && (!groupName || !groupName.trim())) {
            return res.status(400).json({ msg: 'Group/Team Name is required for ' + tournament.type });
        }

        // Ensure all UIDs are provided and valid strings
        if (playerUids.some(uid => !uid || typeof uid !== 'string' || uid.trim() === '')) {
            return res.status(400).json({ msg: 'All FF UIDs must be valid.' });
        }

        // Add user
        tournament.participants.unshift({
            user: req.user.id,
            upiId: upiId || '',
            playerUids: playerUids,
            groupName: groupName || '',
            paymentId: razorpayPaymentId // Store payment ID if any
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

// @route   PUT api/tournaments/:id
// @desc    Update Tournament Details
// @access  Admin
router.put('/:id', [auth, admin], async (req, res) => {
    const { title, type, entryFee, prizePool, schedule, maxPlayers, prizeDistribution, totalWinners, loserPercent } = req.body;
    try {
        let tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Not Found' });

        tournament.title = title;
        tournament.type = type;
        tournament.entryFee = entryFee;
        tournament.prizePool = prizePool;
        tournament.schedule = schedule;
        tournament.maxPlayers = maxPlayers;
        if (prizeDistribution) tournament.prizeDistribution = prizeDistribution;
        tournament.totalWinners = totalWinners;
        tournament.loserPercent = loserPercent || 0;

        await tournament.save();
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

        // Enrich winners with groupName if available for that user
        const enrichedWinners = [];
        for (const winner of winners) {
            const participant = tournament.participants.find(p => p.user && p.user.toString() === winner.user);
            const groupName = participant ? participant.groupName : '';

            // Parse Prize Amount (Remove non-numeric characters like ₹, $, commas)
            const prizeAmount = parseFloat(winner.prize.toString().replace(/[^0-9.]/g, '')) || 0;

            // Update User Wallet
            if (prizeAmount > 0) {
                await User.findByIdAndUpdate(winner.user, {
                    $inc: { walletBalance: prizeAmount }
                });

                // Try to log activity if possible (Silent fail if model issue)
                try {
                    // Assuming ActivityLog model exists and is imported (It is not imported in this file yet, but I will assume simple update for now or skipping explicit log if import missing. 
                    // Actually, I should import it if I want to use it. But let's stick to the user update first to be safe and simple.)
                } catch (e) { console.error('Log error', e); }
            }

            enrichedWinners.push({
                ...winner,
                groupName
            });
        }

        tournament.winners = enrichedWinners;
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

// @route   DELETE api/tournaments/:id/chat/:messageId
// @desc    Delete a message
// @access  Admin
router.delete('/:id/chat/:messageId', [auth, admin], async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Tournament not found' });

        const msgIndex = tournament.messages.findIndex(m => m._id.toString() === req.params.messageId);
        if (msgIndex === -1) return res.status(404).json({ msg: 'Message not found' });

        tournament.messages.splice(msgIndex, 1);
        await tournament.save();
        res.json(tournament.messages);
    } catch (err) {
        console.error(err.message);
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

// @route   GET api/tournaments/status/pending
// @desc    Get pending tournaments
// @access  Super Admin
router.get('/status/pending', [auth, superAdmin], async (req, res) => {
    try {
        const tournaments = await Tournament.find({ approvalStatus: 'pending' }).sort({ createdAt: -1 });
        res.json(tournaments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tournaments/:id/approve
// @desc    Approve a tournament
// @access  Super Admin
router.put('/:id/approve', [auth, superAdmin], async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Tournament not found' });

        tournament.approvalStatus = 'approved';
        await tournament.save();
        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/tournaments/:id
// @desc    Reject (Delete) a tournament
// @access  Super Admin
router.delete('/:id', [auth, superAdmin], async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Tournament not found' });

        await tournament.deleteOne();
        res.json({ msg: 'Tournament rejected/deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/tournaments/manage/all
// @desc    Get tournaments for admin dashboard
// @access  Admin/Super Admin
router.get('/manage/all', [auth, admin], async (req, res) => {
    try {
        let query = {};
        // If Just Admin (not Super): Show "Approved" OR "My Created (Pending/Any)"
        // Actually, usually admins want to see ALL active tournaments to manage them (enter results etc).
        // But they shouldn't see OTHER admins' PENDING tournaments.
        if (req.user.role !== 'super-admin') {
            query = {
                $or: [
                    { approvalStatus: 'approved' },
                    { createdBy: req.user.id }
                ]
            };
        }
        // Super Admin sees ALL (query remains {})

        const tournaments = await Tournament.find(query)
            .populate('participants.user', 'name ffUid')
            .populate('winners.user', 'name ffUid')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(tournaments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
