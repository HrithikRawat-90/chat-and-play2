import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';
import { CHATBOT_EMAIL } from '../services/geminiService.js';

// @desc    Get / Search all users except currently authenticated user
// @route   GET /api/users?search=keyword
// @access  Private
export const getUsers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = {
      _id: { $ne: req.user._id },
    };

    if (search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('name profilePicture bio isOnline lastSeen isBot')
      .sort({ isBot: -1, name: 1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users.',
    });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name profilePicture bio isOnline lastSeen createdAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile.',
    });
  }
};

// @desc    Update current user's profile (name, bio, profilePicture)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, profilePicture } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (name && name.trim()) user.name = name.trim();
    if (typeof bio === 'string') user.bio = bio.trim();
    if (typeof profilePicture === 'string') user.profilePicture = profilePicture.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isOnline: user.isOnline,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile.',
    });
  }
};

// @desc    Toggle block/unblock a user
// @route   POST /api/users/block/:id
// @access  Private
export const toggleBlockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself.',
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Current user not found' });
    }

    const blockedList = currentUser.blockedUsers || [];
    const isAlreadyBlocked = blockedList.some(
      (id) => id.toString() === targetUserId.toString()
    );

    let isBlocked = false;
    if (isAlreadyBlocked) {
      currentUser.blockedUsers = blockedList.filter(
        (id) => id.toString() !== targetUserId.toString()
      );
      isBlocked = false;
    } else {
      currentUser.blockedUsers = [...blockedList, targetUserId];
      isBlocked = true;
    }

    await currentUser.save();

    return res.status(200).json({
      success: true,
      isBlocked,
      message: isBlocked ? 'User blocked successfully.' : 'User unblocked successfully.',
      blockedUsers: currentUser.blockedUsers,
    });
  } catch (error) {
    console.error('Error toggling block user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating block status.',
    });
  }
};

// @desc    Get current user blocked list
// @route   GET /api/users/me/blocked
// @access  Private
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('blockedUsers');
    return res.status(200).json({
      success: true,
      blockedUsers: user?.blockedUsers || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving blocked users.',
    });
  }
};

// @desc    Report a contact
// @route   POST /api/users/report
// @access  Private
export const reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;

    if (!mongoose.isValidObjectId(reportedUserId) || typeof reason !== 'string' || !reason.trim() || reason.length > 200 || (details != null && (typeof details !== 'string' || details.length > 2000))) {
      return res.status(400).json({
        success: false,
        message: 'Provide a valid user, a reason of up to 200 characters, and details of up to 2000 characters.',
      });
    }

    if (reportedUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself.' });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'User to report not found.',
      });
    }

    const adminId = process.env.REPORT_ADMIN_USER_ID;
    if (!adminId || !mongoose.isValidObjectId(adminId)) {
      return res.status(503).json({ success: false, message: 'Reports are currently unavailable. Please try again later.' });
    }
    const [admin, bot] = await Promise.all([
      User.findOne({ _id: adminId, email: 'admin@gmail.com', isBot: { $ne: true } }),
      User.findOne({ email: CHATBOT_EMAIL, isBot: true }),
    ]);
    if (!admin || !bot || admin._id.equals(bot._id)) {
      return res.status(503).json({ success: false, message: 'Reports are currently unavailable. Please try again later.' });
    }

    // The isolated inbox prevents report contents being included in Gemini prompts.
    const conversation = await Conversation.findOneAndUpdate(
      { isModerationInbox: true },
      { $setOnInsert: { isModerationInbox: true, isGroup: false, participants: [admin._id, bot._id] } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const inboxParticipants = conversation.participants.map((id) => id.toString());
    if (inboxParticipants.length !== 2 || !inboxParticipants.includes(admin._id.toString()) || !inboxParticipants.includes(bot._id.toString())) {
      return res.status(503).json({ success: false, message: 'Reports are currently unavailable. Please contact the administrator.' });
    }
    const text = `New user report\nReported by: ${req.user.name} (ID: ${req.user._id})\nReported user: ${reportedUser.name} (ID: ${reportedUser._id})\nReason: ${reason.trim()}\nDetails: ${details?.trim() || 'None provided'}`;
    const message = await Message.create({ conversationId: conversation._id, senderId: bot._id, text });
    conversation.lastMessage = { text: 'New user report', sender: bot._id, createdAt: message.createdAt };
    await conversation.save();
    const populatedMessage = await Message.findById(message._id).populate('senderId', 'name profilePicture bio isOnline isBot');
    if (req.io) {
      req.io.to(`user:${admin._id}`).emit('message:receive', populatedMessage);
      req.io.to(`user:${admin._id}`).emit('conversation:updated', {
        conversationId: conversation._id,
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Report sent to the admin through Chatbot.',
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error submitting report.',
    });
  }
};

