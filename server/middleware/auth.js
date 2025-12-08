const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        // Check Ban Status
        const User = require('../models/User');
        const checkUser = async () => {
            const user = await User.findById(req.user.id);
            if (user && (user.banStatus === 'permanent' || (user.banStatus === 'temporary' && user.banExpires > Date.now()))) {
                return res.status(403).json({ msg: 'Access Denied: You are banned.' });
            }
            next();
        };

        checkUser().catch(err => {
            console.error(err);
            res.status(500).send('Server Error during Auth');
        });

    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
