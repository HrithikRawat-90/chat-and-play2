import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { gameManager } from '../games/gameManager.js';

// @desc    Get user conversations
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate('participants', 'name profilePicture bio isOnline lastSeen isBot')
      .populate('groupAdmin', 'name')
      .populate('lastMessage.sender', 'name')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving conversations.',
    });
  }
};

// @desc    Find or create 1-on-1 conversation
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required.',
      });
    }

    if (currentUserId.toString() === recipientId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot start a conversation with yourself.',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user does not exist.',
      });
    }

    // Check if 1-on-1 personal conversation already exists between these 2 users (exclude groups!)
    let conversation = await Conversation.findOne({
      isGroup: { $ne: true },
      participants: { $all: [currentUserId, recipientId], $size: 2 },
    }).populate('participants', 'name profilePicture bio isOnline lastSeen isBot');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId],
        isGroup: false,
        lastMessage: {
          text: '',
          sender: currentUserId,
          createdAt: new Date(),
        },
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'name profilePicture bio isOnline lastSeen isBot'
      );
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating conversation.',
    });
  }
};

// Helper to generate unique 6-character group join code (e.g. GRP-9X4K2M)
const generateGroupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GRP-${code}`;
};

// @desc    Create new group conversation with join code
// @route   POST /api/conversations/group
// @access  Private
export const createGroup = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { groupName, groupDescription, groupAvatar } = req.body;

    if (!groupName || groupName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Group name is required.',
      });
    }

    // Generate unique group code
    let groupCode = generateGroupCode();
    let existing = await Conversation.findOne({ groupCode });
    while (existing) {
      groupCode = generateGroupCode();
      existing = await Conversation.findOne({ groupCode });
    }

    const defaultAvatar =
      groupAvatar ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName.trim())}`;

    const newGroup = await Conversation.create({
      participants: [currentUserId],
      isGroup: true,
      groupName: groupName.trim(),
      groupDescription: (groupDescription || '').trim(),
      groupAvatar: defaultAvatar,
      groupCode,
      groupAdmin: currentUserId,
      lastMessage: {
        text: `Group "${groupName.trim()}" created. Join code: ${groupCode}`,
        sender: currentUserId,
        createdAt: new Date(),
      },
    });

    const populatedGroup = await Conversation.findById(newGroup._id)
      .populate('participants', 'name profilePicture bio isOnline lastSeen isBot')
      .populate('groupAdmin', 'name')
      .populate('lastMessage.sender', 'name');

    return res.status(201).json({
      success: true,
      message: 'Group created successfully.',
      conversation: populatedGroup,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating group.',
    });
  }
};

// @desc    Join existing group using Group Code
// @route   POST /api/conversations/join-group
// @access  Private
export const joinGroupByCode = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { code } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Group code is required.',
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const group = await Conversation.findOne({
      groupCode: cleanCode,
      isGroup: true,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Invalid group code. No matching group found.',
      });
    }

    // Check if user is already a member
    const alreadyMember = group.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );

    if (!alreadyMember) {
      group.participants.push(currentUserId);
      await group.save();
    }

    const populatedGroup = await Conversation.findById(group._id)
      .populate('participants', 'name profilePicture bio isOnline lastSeen isBot')
      .populate('groupAdmin', 'name')
      .populate('lastMessage.sender', 'name');

    return res.status(200).json({
      success: true,
      alreadyMember,
      message: alreadyMember ? 'You are already a member of this group.' : 'Joined group successfully!',
      conversation: populatedGroup,
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error joining group.',
    });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    // Verify conversation existence and membership
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this conversation.',
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name profilePicture')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving messages.',
    });
  }
};

// @desc    Send a message via REST
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId, text, imageUrl, audioUrl, replyTo } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required.',
      });
    }

    if ((!text || text.trim() === '') && !imageUrl && !audioUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    // Verify membership
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to post to this conversation.',
      });
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: currentUserId,
      text: text ? text.trim() : '',
      imageUrl: imageUrl || '',
      audioUrl: audioUrl || '',
      replyTo: replyTo || { text: '', senderName: '' },
    });

    // Update conversation lastMessage & timestamp
    conversation.lastMessage = {
      text: text ? text.trim() : (audioUrl ? '🎤 Voice message' : (imageUrl ? '📷 Shared an image' : '')),
      sender: currentUserId,
      createdAt: new Date(),
    };
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      'senderId',
      'name profilePicture'
    );

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending message.',
    });
  }
};

// @desc    Delete a conversation and all its messages
// @route   DELETE /api/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this conversation.',
      });
    }

    // 1. Delete all messages for this conversation
    await Message.deleteMany({ conversationId: id });

    // 2. End any running game session
    gameManager.endGameByConversation(id);
    gameManager.clearInvite(id);

    // 3. Delete the conversation document
    await Conversation.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Conversation and all messages deleted successfully.',
      conversationId: id,
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting conversation.',
    });
  }
};

