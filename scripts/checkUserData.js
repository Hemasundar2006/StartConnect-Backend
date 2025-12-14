/**
 * User Data Diagnostic Script
 * 
 * This script checks if a user has all required data for startup functionality:
 * - User exists
 * - User has Startup role
 * - StartupProfile exists
 * - Team exists with user as leader
 * 
 * Usage:
 *   node scripts/checkUserData.js <user_email>
 * 
 * Example:
 *   node scripts/checkUserData.js user@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const StartupProfile = require('../src/models/StartupProfile');
const Team = require('../src/models/Team');

const checkUserData = async (userEmail) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected\n');

        if (!userEmail) {
            console.error('❌ Error: Please provide a user email');
            console.log('Usage: node scripts/checkUserData.js <user_email>');
            process.exit(1);
        }

        console.log(`Checking user data for: ${userEmail}\n`);
        console.log('='.repeat(50));

        // 1. Check if user exists
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('✅ User found:');
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Is Verified: ${user.isVerified}`);
        console.log(`   Has startupProfileId: ${!!user.startupProfileId}`);
        console.log(`   Has teamId: ${!!user.teamId}`);
        console.log('');

        // 2. Check role
        if (user.role !== 'Startup') {
            console.log('❌ User role is not "Startup"');
            console.log(`   Current role: ${user.role}`);
            console.log('   Fix: User needs to register as a Startup');
            process.exit(1);
        }
        console.log('✅ User role is "Startup"');
        console.log('');

        // 3. Check startup profile
        let startupProfile = null;
        if (user.startupProfileId) {
            startupProfile = await StartupProfile.findById(user.startupProfileId);
        } else {
            startupProfile = await StartupProfile.findOne({ userId: user._id });
        }

        if (!startupProfile) {
            console.log('❌ Startup profile not found');
            console.log('   Issue: User has no startup profile');
            console.log('   Fix: User needs to complete startup registration');
            console.log('   Or create profile manually');
            process.exit(1);
        }

        console.log('✅ Startup profile found:');
        console.log(`   Profile ID: ${startupProfile._id}`);
        console.log(`   Company Name: ${startupProfile.companyName}`);
        console.log(`   Website: ${startupProfile.website}`);
        console.log(`   User ID in profile: ${startupProfile.userId}`);
        console.log(`   Matches user: ${startupProfile.userId.toString() === user._id.toString()}`);
        console.log('');

        // 4. Check team
        let team = null;
        if (user.teamId) {
            team = await Team.findById(user.teamId);
        } else {
            team = await Team.findOne({ leaderId: user._id });
        }

        if (!team) {
            console.log('❌ Team not found');
            console.log('   Issue: User is not a team leader');
            console.log('   Fix: Create team for this user');
            console.log('');
            console.log('   Would you like to create a team? (This script will not auto-create)');
            console.log('   You can create it manually or fix the registration process');
            process.exit(1);
        }

        console.log('✅ Team found:');
        console.log(`   Team ID: ${team._id}`);
        console.log(`   Leader ID: ${team.leaderId}`);
        console.log(`   Matches user: ${team.leaderId.toString() === user._id.toString()}`);
        console.log(`   Company ID: ${team.companyId}`);
        console.log(`   Matches profile: ${team.companyId.toString() === startupProfile._id.toString()}`);
        console.log(`   Members count: ${team.members.length}`);
        console.log(`   Pending invites: ${team.pendingInvites.length}`);
        console.log('');

        // Summary
        console.log('='.repeat(50));
        console.log('✅ All checks passed! User data is complete.');
        console.log('');
        console.log('User can:');
        console.log('  ✓ Access startup profile');
        console.log('  ✓ Invite team members');
        console.log('  ✓ Manage team');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

// Get email from command line arguments
const userEmail = process.argv[2];
checkUserData(userEmail);

