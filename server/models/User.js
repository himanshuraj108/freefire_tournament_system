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
        enum: ['user', 'admin', 'sub-admin'],
        default: 'user',
    },
    walletBalance: {
        type: Number,
        default: 0,
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
