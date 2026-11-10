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
      .select('name email profilePicture bio isOnline lastSeen')
      .sort({ name: 1 })
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
      'name email profilePicture bio isOnline lastSeen createdAt'
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

