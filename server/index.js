const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection & Admin Seeding
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/freefire_gaming')
    .then(async () => {
        console.log('MongoDB Connected');

        // Seed Admin
        const adminExists = await User.findOne({ ffUid: '123456789' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin@123', salt);

            const admin = new User({
                name: 'Super Admin',
                ffUid: '123456789',
                email: 'admin@gamers.com',
                password: hashedPassword,
                role: 'super-admin',
                isEmailVerified: true
            });

            await admin.save();
            console.log('Default Admin Created: 123456789 / admin@123');
        } else if (adminExists.role !== 'super-admin') {
            adminExists.role = 'super-admin';
            await adminExists.save();
            console.log('Admin Role Updated to Super-Admin');
        }
    })
    .catch(err => console.error(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/users', require('./routes/users'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));

app.get('/', (req, res) => {
    res.send('FreeFire Gaming API is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
