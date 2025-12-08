const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    ffUid: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationOtp: String,
    emailVerificationExpire: Date,
    resetPasswordOtp: String,
    resetPasswordExpire: Date,
    avatar: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'sub-admin', 'super-admin'],
        default: 'user',
    },
    walletBalance: {
        type: Number,
        default: 0,
    },
    banStatus: {
        type: String,
        enum: ['none', 'temporary', 'permanent'],
        default: 'none'
    },
    banExpires: {
        type: Date
    },
    banRequest: {
        status: { type: String, enum: ['none', 'pending'], default: 'none' },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        requestedAt: Date
    },
    tournamentsJoined: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('User', userSchema);
