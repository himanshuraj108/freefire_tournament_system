const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    type: {
        type: String,
        enum: ['Solo', 'Duo', 'Squad'],
        required: true,
    },
    entryFee: {
        type: Number,
        required: true,
    },
    prizePool: {
        type: String,
        required: true,
    },
    prizeDistribution: [{
        rank: Number,
        prize: String,
    }],
    totalWinners: {
        type: Number,
        default: 3
    },
    schedule: {
        type: Date,
        required: true,
    },
    startTime: Date,
    endTime: Date,
    roomId: String,
    roomPassword: String,
    status: {
        type: String,
        enum: ['Open', 'Upcoming', 'Ongoing', 'Completed', 'ResultsPending', 'Closed'],
        default: 'Open',
    },
    maxPlayers: {
        type: Number,
        default: 48,
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        upiId: String,
        playerUids: [String], // Array of FF UIDs for the team (Leader + Members)
        groupName: String, // Team/Squad Name
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Verified'],
            default: 'Pending'
        }
    }],
    winners: [{
        position: Number, // 1, 2, 3
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        groupName: String, // Snapshotted group name
        prize: String
    }],

    chatEnabled: {
        type: Boolean,
        default: true
    },
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderName: String,
        role: String,
        text: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Tournament', tournamentSchema);
