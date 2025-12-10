const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// @route   POST api/wallet/withdraw
// @desc    Request a withdrawal
// @access  Private
router.post('/withdraw', auth, async (req, res) => {
    const { amount, upiId } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ msg: 'Invalid amount' });
    if (!upiId) return res.status(400).json({ msg: 'UPI ID is required' });

    try {
        const user = await User.findById(req.user.id);

        if (user.walletBalance < amount) {
            return res.status(400).json({ msg: 'Insufficient balance' });
        }

        // Deduct balance immediately
        user.walletBalance -= amount;
        await user.save();

        const withdrawal = new WithdrawalRequest({
            user: req.user.id,
            amount,
            upiId
        });

        await withdrawal.save();
        res.json({ withdrawal, newBalance: user.walletBalance });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/wallet/history
// @desc    Get user's withdrawal history
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const history = await WithdrawalRequest.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/wallet/admin/requests
// @desc    Get all pending requests (Admin)
// @access  Admin
router.get('/admin/requests', [auth, admin], async (req, res) => {
    try {
        const requests = await WithdrawalRequest.find({ status: 'pending' })
            .populate('user', 'name ffUid email')
            .sort({ createdAt: 1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/wallet/admin/requests/:id
// @desc    Approve or Reject Withdrawal
// @access  Admin
router.put('/admin/requests/:id', [auth, admin], async (req, res) => {
    const { status, comment } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status' });
    }

    try {
        const request = await WithdrawalRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        if (request.status !== 'pending') {
            return res.status(400).json({ msg: 'Request already processed' });
        }

        request.status = status;
        request.adminComment = comment || '';
        request.processedAt = Date.now();

        // If rejected, refund the amount
        if (status === 'rejected') {
            const user = await User.findById(request.user);
            if (user) {
                user.walletBalance += request.amount;
                await user.save();
            }
        }

        await request.save();
        res.json(request);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
