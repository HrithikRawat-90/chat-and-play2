import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const removeDefaultUsers = async () => {
  try {
    const demoEmails = [
      'talan@chatplay.com',
      'aubrey@chatplay.com',
      'kathryn@chatplay.com',
      'bruce@chatplay.com',
    ];

    // Find demo users
    const demoUsers = await User.find({ email: { $in: demoEmails } });
    if (demoUsers.length > 0) {
      const demoUserIds = demoUsers.map((u) => u._id);

      // Remove conversations and messages associated with demo users
      const convs = await Conversation.find({ participants: { $in: demoUserIds } });
      const convIds = convs.map((c) => c._id);

      await Message.deleteMany({ conversationId: { $in: convIds } });
      await Conversation.deleteMany({ _id: { $in: convIds } });
      await User.deleteMany({ _id: { $in: demoUserIds } });

      console.log(`[Database] Removed ${demoUsers.length} default sample users.`);
    }
  } catch (err) {
    console.warn('[Database] Could not remove default users:', err.message);
  }
};

