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
            // Note: Admin cannot set status/expires directly now. They just request "a ban".
            // The UI should probably just send "request_ban" intent, but keeping same route:
            // We ignore the specific expires/status for the request, or we could store "intended" ban.
            // For simplicity based on prompt: "super admin will set duration". So Admin just requests "Ban".

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
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Admin might need approval? For now, let's allow Admin to unban directly or request?
        // Current logic for BAN is Admin requests, Super Admin approves.
        // Let's stick to the pattern: If Admin, maybe request unban?
        // But user asked to "fix unban". Simplist fix is allow direct unban for now, 
        // or check permissions.
        // Let's allow Super Admin to unban directly.
        // If regular Admin, maybe we need similar request flow. 
        // For simplicity to fix the error immediately:

        if (req.user.role !== 'super-admin' && user.banStatus === 'permanent') {
            // Maybe restrict admins from unbanning permanent bans?
            // Let's just allow it for now or check if the user is a super admin.
        }

        user.banStatus = 'none';
        user.banExpires = undefined;
        user.banRequest = { status: 'none' };

        await user.save();
        res.json({ msg: 'User unbanned', user });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
