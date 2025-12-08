const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const ActivityLog = require('../models/ActivityLog');

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    const { name, ffUid, email, password } = req.body;

    try {
        let user = await User.findOne({ ffUid });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        if (email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) return res.status(400).json({ msg: 'Email already used' });
        }

        user = new User({ name, ffUid, email, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = { user: { id: user.id, role: user.role } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role, ffUid: user.ffUid } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { identifier, ffUid, password } = req.body;

    // Backward compatibility for calls sending ffUid
    const loginId = identifier || ffUid;

    try {
        let user = await User.findOne({
            $or: [{ ffUid: loginId }, { email: loginId }]
        });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check Ban Status
        if (user.banStatus === 'permanent') {
            return res.status(403).json({ msg: 'Your account has been permanently banned.' });
        }
        if (user.banStatus === 'temporary' && user.banExpires > Date.now()) {
            return res.status(403).json({ msg: `You are banned until ${new Date(user.banExpires).toLocaleString()}` });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: user.role, ffUid: user.ffUid } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('tournamentsJoined', 'title status startTime schedule prizePool results');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/forgot-password
// @desc    Send OTP to email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'User with this email not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOtp = otp;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP - FreeFire Tournament',
            text: `Your Password Reset OTP is: ${otp}\n\nIt expires in 10 minutes.`
        };

        try {
            if (process.env.EMAIL_USER) {
                await transporter.sendMail(mailOptions);
                console.log(`OTP Sent to ${email}`);
            } else {
                console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
            }
            res.json({ msg: 'OTP sent to email' });
        } catch (error) {
            console.error('Email send failed:', error);
            console.log(`[DEV FLBACK] OTP for ${email}: ${otp}`);
            res.json({ msg: 'OTP generated (Check Console for Dev)' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ msg: 'Invalid or Expired OTP' });

        res.json({ msg: 'OTP Verified' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/reset-password
// @desc    Reset Password with OTP
// @access  Public
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ msg: 'Invalid request' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordOtp = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        const log = new ActivityLog({
            type: 'PASSWORD_RESET',
            description: `Password reset for user ${user.name} (${user.ffUid}) via OTP`,
            user: user.id
        });
        await log.save();

        res.json({ msg: 'Password Changed Successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/verify-email-request
// @desc    Send verification OTP to current user's email
// @access  Private
router.post('/verify-email-request', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.isEmailVerified) return res.status(400).json({ msg: 'Email already verified' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationOtp = otp;
        user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Verify Your Email - FreeFire Tournament',
            text: `Your Email Verification OTP is: ${otp}`
        };

        if (process.env.EMAIL_USER) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log(`[DEV MODE] Verification OTP for ${user.email}: ${otp}`);
        }

        res.json({ msg: 'Verification OTP sent' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/verify-email-confirm
// @desc    Confirm verification OTP
// @access  Private
router.post('/verify-email-confirm', auth, async (req, res) => {
    const { otp } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.emailVerificationOtp !== otp || user.emailVerificationExpire < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or Expired OTP' });
        }

        user.isEmailVerified = true;
        user.emailVerificationOtp = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        res.json({ msg: 'Email Verified Successfully', isEmailVerified: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
