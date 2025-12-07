const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    type: { type: String, required: true }, // e.g., 'PASSWORD_RESET', 'TOURNAMENT_CREATED'
    description: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, user who performed action
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
