const Message = require('../models/Message');
const Team = require('../models/Team');
const mongoose = require('mongoose');

/**
 * Socket.io chat event handlers
 */
module.exports = (io) => {
    // Store active users per team for presence tracking
    const activeUsers = new Map(); // teamId -> Set of userIds

    io.on('connection', (socket) => {
        const userId = socket.userId;
        const userName = socket.user.name;
        
        console.log(`✅ User connected: ${userName} (${userId})`);

        /**
         * Event: join_team
         * When a user joins a team chat room
         */
        socket.on('join_team', async (teamId) => {
            try {
                // Validate teamId
                if (!mongoose.Types.ObjectId.isValid(teamId)) {
                    socket.emit('error', { message: 'Invalid team ID' });
                    return;
                }

                // Verify user is member of the team
                const team = await Team.findById(teamId);
                
                if (!team) {
                    socket.emit('error', { message: 'Team not found' });
                    return;
                }

                // Check if user is a member or leader
                const isMember = team.members.some(
                    memberId => memberId.toString() === userId
                );
                const isLeader = team.leaderId.toString() === userId;

                if (!isMember && !isLeader) {
                    socket.emit('error', { 
                        message: 'Access denied: You are not a member of this team' 
                    });
                    return;
                }

                // Join the Socket.io room
                socket.join(teamId);
                socket.currentTeamId = teamId;

                // Track active user in this team
                if (!activeUsers.has(teamId)) {
                    activeUsers.set(teamId, new Set());
                }
                activeUsers.get(teamId).add(userId);

                console.log(`👥 User ${userName} joined team: ${teamId}`);

                // Notify others in the team about new user
                socket.to(teamId).emit('user_joined', {
                    userId,
                    userName,
                    timestamp: new Date()
                });

                // Send active users list to the joining user
                const activeUsersInTeam = Array.from(activeUsers.get(teamId) || []);
                socket.emit('active_users', {
                    teamId,
                    users: activeUsersInTeam,
                    count: activeUsersInTeam.length
                });

            } catch (error) {
                console.error('Error in join_team:', error);
                socket.emit('error', { 
                    message: 'Failed to join team chat',
                    error: error.message 
                });
            }
        });

        /**
         * Event: send_message
         * When a user sends a message to their team
         */
        socket.on('send_message', async (data) => {
            try {
                const { teamId, text } = data;

                // Validation
                if (!teamId || !text) {
                    socket.emit('error', { message: 'Team ID and message text are required' });
                    return;
                }

                if (!mongoose.Types.ObjectId.isValid(teamId)) {
                    socket.emit('error', { message: 'Invalid team ID' });
                    return;
                }

                if (text.trim().length === 0) {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                if (text.length > 5000) {
                    socket.emit('error', { message: 'Message too long (max 5000 characters)' });
                    return;
                }

                // Verify user is member of the team
                const team = await Team.findById(teamId);
                
                if (!team) {
                    socket.emit('error', { message: 'Team not found' });
                    return;
                }

                const isMember = team.members.some(
                    memberId => memberId.toString() === userId
                );
                const isLeader = team.leaderId.toString() === userId;

                if (!isMember && !isLeader) {
                    socket.emit('error', { 
                        message: 'Access denied: You are not a member of this team' 
                    });
                    return;
                }

                // Save message to database
                const newMessage = await Message.create({
                    senderId: userId,
                    teamId,
                    text: text.trim(),
                    timestamp: new Date()
                });

                // Populate sender details before broadcasting
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('senderId', 'name email profilePicture role')
                    .lean();

                console.log(`💬 Message sent by ${userName} to team ${teamId}`);

                // Broadcast message to all users in the team room (including sender)
                io.to(teamId).emit('receive_message', populatedMessage);

                // Acknowledge message sent successfully
                socket.emit('message_sent', {
                    success: true,
                    messageId: newMessage._id,
                    timestamp: newMessage.timestamp
                });

            } catch (error) {
                console.error('Error in send_message:', error);
                socket.emit('error', { 
                    message: 'Failed to send message',
                    error: error.message 
                });
            }
        });

        /**
         * Event: leave_team
         * When a user leaves a team chat room
         */
        socket.on('leave_team', (teamId) => {
            try {
                if (socket.currentTeamId === teamId) {
                    socket.leave(teamId);
                    socket.currentTeamId = null;

                    // Remove from active users
                    if (activeUsers.has(teamId)) {
                        activeUsers.get(teamId).delete(userId);
                        if (activeUsers.get(teamId).size === 0) {
                            activeUsers.delete(teamId);
                        }
                    }

                    console.log(`👋 User ${userName} left team: ${teamId}`);

                    // Notify others
                    socket.to(teamId).emit('user_left', {
                        userId,
                        userName,
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.error('Error in leave_team:', error);
            }
        });

        /**
         * Event: typing
         * When a user is typing a message
         */
        socket.on('typing', (teamId) => {
            if (socket.currentTeamId === teamId) {
                socket.to(teamId).emit('user_typing', {
                    userId,
                    userName
                });
            }
        });

        /**
         * Event: stop_typing
         * When a user stops typing
         */
        socket.on('stop_typing', (teamId) => {
            if (socket.currentTeamId === teamId) {
                socket.to(teamId).emit('user_stop_typing', {
                    userId,
                    userName
                });
            }
        });

        /**
         * Handle disconnection
         */
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${userName} (${userId})`);

            // Remove from all active teams
            activeUsers.forEach((users, teamId) => {
                if (users.has(userId)) {
                    users.delete(userId);
                    
                    // Notify team members
                    socket.to(teamId).emit('user_left', {
                        userId,
                        userName,
                        timestamp: new Date()
                    });

                    // Clean up empty team sets
                    if (users.size === 0) {
                        activeUsers.delete(teamId);
                    }
                }
            });
        });

        /**
         * Handle errors
         */
        socket.on('error', (error) => {
            console.error(`Socket error for user ${userName}:`, error);
        });
    });
};

