require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminEmail = 'admin@startconnect.com';
        const adminPassword = 'adminpassword123';

        let user = await User.findOne({ email: adminEmail });

        if (user) {
            console.log('Admin user already exists');
            if (user.role !== 'Admin') {
                user.role = 'Admin';
                await user.save();
                console.log('User updated to Admin role');
            }
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            user = await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'Admin',
                isVerified: true,
                verificationBadge: ['Admin']
            });
            console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createAdmin();
