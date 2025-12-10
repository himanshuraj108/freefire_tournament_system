const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');

// @route   GET api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
    try {
        let query = {};
        let select = '-password';

        // Admin Restriction
        if (req.user.role === 'admin') {
            query = { role: { $ne: 'super-admin' } }; // Hide Super Admins
            select = '-password -email'; // Hide Emails
        }

        const users = await User.find(query).select(select).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/:id/ban
// @desc    Ban or Unban user
// @access  Private/Admin
router.put('/:id/ban', [auth, admin], async (req, res) => {
    const { banStatus, banExpires } = req.body; // banStatus: 'none', 'temporary', 'permanent'

    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Super Admin: Direct Action
        if (req.user.role === 'super-admin') {
            user.banStatus = banStatus;
            user.banRequest = { status: 'none' }; // Clear any pending requests
            if (banStatus === 'temporary' && banExpires) {
                user.banExpires = banExpires;
            } else {
                user.banExpires = undefined;
            }
            await user.save();
            return res.json({ msg: 'User ban status updated (Direct)', user });
        }

        // Regular Admin: Create Request
        if (req.user.role === 'admin') {
            user.banRequest = {
                status: 'pending',
                requestedBy: req.user.id,
                requestedAt: Date.now()
            };
            await user.save();
            return res.json({ msg: 'Ban request submitted to Super Admin', user });
        }

        return res.status(403).json({ msg: 'Unauthorized action' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/:id/ban-manage
// @desc    Approve or Reject Ban Request
// @access  Private/SuperAdmin
const superAdmin = require('../middleware/superAdmin');
router.put('/:id/ban-manage', [auth, superAdmin], async (req, res) => {
    const { action, banStatus, banExpires } = req.body; // action: 'approve' | 'reject'

    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (action === 'reject') {
            user.banRequest = { status: 'none' };
            await user.save();
            return res.json({ msg: 'Ban request rejected', user });
        }

        if (action === 'approve') {
            user.banStatus = banStatus || 'permanent'; // Default to permanent if not specified
            if (banStatus === 'temporary' && banExpires) {
                user.banExpires = banExpires;
            } else {
                user.banExpires = undefined;
            }
            user.banRequest = { status: 'none' };
            await user.save();
            return res.json({ msg: 'Ban request approved and applied', user });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/:id/role
// @desc    Change User Role
// @access  Private/SuperAdmin
router.put('/:id/role', [auth, superAdmin], async (req, res) => {
    const { role } = req.body; // 'admin', 'user', 'sub-admin'

    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.role === 'super-admin') {
            return res.status(403).json({ msg: 'Cannot change role of a Super Admin' });
        }

        user.role = role;
        await user.save();
        res.json({ msg: `User role updated to ${role}`, user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/:id/unban
// @desc    Unban a user
// @access  Private/Admin
router.put('/:id/unban', [auth, admin], async (req, res) => {
    try {
        console.log(`[Unban] Attempting to unban user ${req.params.id} by admin ${req.user.id}`);
        let user = await User.findById(req.params.id);
        if (!user) {
            console.log('[Unban] User not found');
            return res.status(404).json({ msg: 'User not found' });
        }

        if (req.user.role !== 'super-admin' && user.banStatus === 'permanent') {
            console.log('[Unban] Admin tried to lift permanent ban - soft blocked');
            // Proceeding for now as per previous logic, just logging
        }

        user.banStatus = 'none';
        user.banExpires = null; // Use null instead of undefined for Date
        user.banRequest = { status: 'none', requestedBy: null, requestedAt: null };

        await user.save();
        console.log(`[Unban] User ${user.name} unbanned successfully`);
        res.json({ msg: 'User unbanned', user });

    } catch (err) {
        console.error('[Unban Error]', err.message);
        res.status(500).json({ msg: 'Server Error during unban', error: err.message });
    }
});

module.exports = router;
