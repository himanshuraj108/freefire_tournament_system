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

// CORS Configuration
const corsOptions = {
    origin: ['https://rylgames.vercel.app', 'http://localhost:5173'], // Frontend domains
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files (wrapped for safety)
try {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
} catch (error) {
    console.warn('Uploads directory not available');
}

// Cached MongoDB Connection
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Options if needed
        });
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        await seedAdmin();
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
    }
};

// Admin Seeding
const seedAdmin = async () => {
    try {
        const adminUid = process.env.SUPER_ADMIN_UID;
        const adminEmail = process.env.SUPER_ADMIN_EMAIL;
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (!adminUid || !adminEmail || !adminPassword) return; // Skip if env missing

        const adminExists = await User.findOne({ ffUid: adminUid });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);
            await User.create({
                name: 'Super Admin',
                ffUid: adminUid,
                email: adminEmail,
                password: hashedPassword,
                role: 'super-admin',
                isEmailVerified: true
            });
            console.log('Default Admin Created');
        } else if (adminExists.role !== 'super-admin') {
            adminExists.role = 'super-admin';
            await adminExists.save();
            console.log('Admin Role Updated');
        }
    } catch (err) {
        console.log('Seeding skipped or failed:', err.message);
    }
};

// Middleware to Ensure DB Connection
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/wallet', require('./routes/wallet'));

app.get('/', (req, res) => {
    res.send('FreeFire Gaming API is Running');
});

// Local Execution
if (require.main === module) {
    app.listen(PORT, async () => {
        await connectDB();
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;
