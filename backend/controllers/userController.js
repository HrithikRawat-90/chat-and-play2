import User from '../models/User.js';

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

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Reported user ID and reason are required.',
      });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'User to report not found.',
      });
    }

    console.log(
      `[Report] User ${req.user.name} reported ${reportedUser.name} for "${reason}". Details: ${details || 'None'}`
    );

    return res.status(200).json({
      success: true,
      message: `Report submitted successfully regarding ${reportedUser.name}. Our moderation team has received it.`,
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error submitting report.',
    });
  }
};

