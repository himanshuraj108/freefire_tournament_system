const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin' && user.role !== 'sub-admin' && user.role !== 'super-admin') {
            return res.status(403).json({ msg: 'Access Denied: Admins Only' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
