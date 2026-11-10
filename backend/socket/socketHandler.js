import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { gameManager } from '../games/gameManager.js';
import { getChatbotReply } from '../services/geminiService.js';

// In-memory mapping of online users: userId string -> Set of socket IDs
const onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'chat_play_jwt_secret_dev_key_2026'
      );
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('[Socket Auth Error]', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User connected: ${socket.user.name} (${socket.id})`);

    // 1. Manage user presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct notifications
    socket.join(`user:${userId}`);

    // Auto-join all existing conversation rooms for this user
    try {
      const userConvs = await Conversation.find({ participants: userId }).select('_id');
      userConvs.forEach((c) => {
        socket.join(c._id.toString());
      });
      console.log(`[Socket] ${socket.user.name} auto-joined ${userConvs.length} conversation rooms`);
    } catch (roomErr) {
      console.warn('Could not auto-join conversation rooms:', roomErr.message);
    }

    // Update user status in DB
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });
    } catch (dbErr) {
      console.warn('Could not update user online status in DB:', dbErr.message);
    }

    // Broadcast user online to everyone
    io.emit('user:online', {
      userId,
      isOnline: true,
    });

    // Send currently online users list to newly connected socket (always include AI Chatbot)
    const activeUserIds = Array.from(onlineUsers.keys());
    try {
      const botDoc = await User.findOne({ $or: [{ isBot: true }, { name: 'Chatbot' }] }).select('_id');
      if (botDoc && !activeUserIds.includes(botDoc._id.toString())) {
        activeUserIds.push(botDoc._id.toString());
      }
    } catch (_) {}
    socket.emit('users:online:list', activeUserIds);

    // 2. Join private conversation room
    socket.on('join:conversation', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) return;

        socket.join(conversationId);
        console.log(`[Socket] ${socket.user.name} joined room: ${conversationId}`);

        // If there's an ongoing game in this conversation, send current state
        const ongoingGame = gameManager.getGameByConversation(conversationId);
        if (ongoingGame) {
          socket.emit('game:started', ongoingGame);
        }

        // If there's an active invite, notify
        const existingInvite = gameManager.getInvite(conversationId);
        if (existingInvite) {
          socket.emit('game:invite:received', existingInvite);
        }
      } catch (err) {
        console.error('Error joining conversation room:', err.message);
      }
    });

    // 3. Leave private conversation room
    socket.on('leave:conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(conversationId);
        console.log(`[Socket] ${socket.user.name} left room: ${conversationId}`);
      }
    });

    // 4. Real-time message sending
    socket.on('message:send', async ({ conversationId, text, imageUrl, replyTo }, callback) => {
      try {
        if (!conversationId) {
          if (callback) callback({ success: false, message: 'Conversation ID required' });
          return;
        }

        if ((!text || text.trim() === '') && !imageUrl) {
          if (callback) callback({ success: false, message: 'Message content required' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === userId
        );
        if (!isParticipant) {
          if (callback) callback({ success: false, message: 'Unauthorized' });
          return;
        }

        // Save message to MongoDB
        const newMsg = await Message.create({
          conversationId,
          senderId: socket.user._id,
          text: text ? text.trim() : '',
          imageUrl: imageUrl || '',
          replyTo: replyTo || { text: '', senderName: '' },
          isRead: false,
        });

        // Update conversation summary
        conversation.lastMessage = {
          text: text ? text.trim() : (imageUrl ? '📷 Shared an image' : ''),
          sender: socket.user._id,
          createdAt: new Date(),
        };
        await conversation.save();

        const populatedMsg = await Message.findById(newMsg._id).populate(
          'senderId',
          'name profilePicture bio isOnline'
        );

        // Emit message:receive to conversation room AND directly to participants' personal rooms
        io.to(conversationId).emit('message:receive', populatedMsg);
        conversation.participants.forEach((pId) => {
          io.to(`user:${pId.toString()}`).emit('message:receive', populatedMsg);
          io.to(`user:${pId.toString()}`).emit('conversation:updated', {
            conversationId,
            lastMessage: conversation.lastMessage,
            updatedAt: conversation.updatedAt,
          });
        });

        if (callback) callback({ success: true, message: populatedMsg });

        // Auto-reply if conversational partner is Chatbot
        try {
          const participants = await User.find({ _id: { $in: conversation.participants } });
          const botUser = participants.find((p) => p.isBot || p.email === 'chatbot@chatplay.ai');

          if (botUser && botUser._id.toString() !== userId) {
            // 1. Emit typing indicator for bot
            io.to(conversationId).emit('typing:start', {
              conversationId,
              userId: botUser._id.toString(),
              userName: 'Chatbot (Gemini AI)',
            });

            // 2. Fetch recent conversation context
            const recentMsgs = await Message.find({ conversationId })
              .populate('senderId', 'name isBot')
              .sort({ createdAt: -1 })
              .limit(8);
            recentMsgs.reverse();

            // 3. Call Gemini service asynchronously
            setTimeout(async () => {
              try {
                const botReplyText = await getChatbotReply(recentMsgs);

                // Stop typing indicator
                io.to(conversationId).emit('typing:stop', {
                  conversationId,
                  userId: botUser._id.toString(),
                });

                // Save bot reply
                const botMsg = await Message.create({
                  conversationId,
                  senderId: botUser._id,
                  text: botReplyText,
                  imageUrl: '',
                  isRead: true,
                });

                conversation.lastMessage = {
                  text: botReplyText,
                  sender: botUser._id,
                  createdAt: new Date(),
                };
                await conversation.save();

                const populatedBotMsg = await Message.findById(botMsg._id).populate(
                  'senderId',
                  'name profilePicture bio isOnline isBot'
                );

                // Emit to conversation room and to human user
                io.to(conversationId).emit('message:receive', populatedBotMsg);
                io.to(`user:${userId}`).emit('message:receive', populatedBotMsg);
                io.to(`user:${userId}`).emit('conversation:updated', {
                  conversationId,
                  lastMessage: conversation.lastMessage,
                  updatedAt: conversation.updatedAt,
                });
              } catch (botErr) {
                console.error('[Chatbot Error]', botErr.message);
                io.to(conversationId).emit('typing:stop', {
                  conversationId,
                  userId: botUser._id.toString(),
                });
              }
            }, 600);
          }
        } catch (botCheckErr) {
          console.warn('Could not check chatbot participation:', botCheckErr.message);
        }
      } catch (err) {
        console.error('Error handling message:send:', err.message);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // 5. Typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('typing:start', {
        conversationId,
        userId,
        userName: socket.user.name,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('typing:stop', {
        conversationId,
        userId,
      });
    });

    // 6. Read receipts
    socket.on('message:read', async ({ conversationId, messageId }) => {
      try {
        if (!conversationId || !messageId) return;
        await Message.findByIdAndUpdate(messageId, { isRead: true });
        socket.to(conversationId).emit('message:read', {
          conversationId,
          messageId,
          readBy: userId,
        });
      } catch (err) {
        console.warn('Error updating read status:', err.message);
      }
    });

    // ----------------------------------------------------
    // 7. MULTIPLAYER PLAY TOGETHER (TIC-TAC-TOE) EVENTS
    // ----------------------------------------------------

    // A. Send Game Invitation
    socket.on('game:invite', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) {
          if (callback) callback({ success: false, message: 'Conversation ID required' });
          return;
        }

        const conversation = await Conversation.findById(conversationId).populate(
          'participants',
          'name profilePicture'
        );
        if (!conversation) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        const recipient = conversation.participants.find(
          (p) => p._id.toString() !== userId
        );
        if (!recipient) {
          if (callback) callback({ success: false, message: 'Recipient not found' });
          return;
        }

        // Ensure inviter socket has joined the conversation room
        socket.join(conversationId);

        const invite = gameManager.createInvite(conversationId, socket.user, recipient);

        // Broadcast invite to conversation room and directly to recipient's personal room
        io.to(conversationId).emit('game:invite:received', invite);
        io.to(`user:${recipient._id.toString()}`).emit('game:invite:received', invite);

        console.log(`[Game] ${socket.user.name} invited ${recipient.name} to Tic-Tac-Toe`);
        if (callback) callback({ success: true, invite });

        // If recipient is Chatbot, auto-accept challenge!
        const recipientDoc = await User.findById(recipient._id);
        if (recipientDoc?.isBot || recipientDoc?.email === 'chatbot@chatplay.ai') {
          setTimeout(() => {
            const newGame = gameManager.startNewGame(conversationId, socket.user, recipientDoc);
            const playerXId = (newGame.players.X.id || newGame.players.X._id).toString();
            const playerOId = (newGame.players.O.id || newGame.players.O._id).toString();

            io.to(conversationId).emit('game:started', newGame);
            io.to(`user:${playerXId}`).emit('game:started', newGame);
            io.to(`user:${playerOId}`).emit('game:started', newGame);
            console.log(`[Game] Chatbot automatically accepted match in room ${conversationId}`);
          }, 800);
        }
      } catch (err) {
        console.error('Error handling game:invite:', err.message);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // B. Accept Game Invitation
    socket.on('game:accept', async ({ conversationId }, callback) => {
      try {
        const invite = gameManager.getInvite(conversationId);
        if (!invite) {
          if (callback) callback({ success: false, message: 'No active invitation found' });
          return;
        }

        // Ensure acceptor socket has joined the conversation room
        socket.join(conversationId);

        // Creator is Player X, Acceptor is Player O
        const newGame = gameManager.startNewGame(
          conversationId,
          invite.sender,
          invite.recipient
        );

        const playerXId = (newGame.players.X.id || newGame.players.X._id).toString();
        const playerOId = (newGame.players.O.id || newGame.players.O._id).toString();

        // Broadcast to conversation room AND directly to both players
        io.to(conversationId).emit('game:started', newGame);
        io.to(`user:${playerXId}`).emit('game:started', newGame);
        io.to(`user:${playerOId}`).emit('game:started', newGame);

        console.log(`[Game] Tic-Tac-Toe match started in room ${conversationId}: ${invite.sender.name} (X) vs ${invite.recipient.name} (O)`);

        if (callback) callback({ success: true, game: newGame });
      } catch (err) {
        console.error('Error accepting game invite:', err.message);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // C. Reject Game Invitation
    socket.on('game:reject', ({ conversationId }) => {
      const invite = gameManager.getInvite(conversationId);
      gameManager.clearInvite(conversationId);
      const payload = {
        conversationId,
        rejectedBy: socket.user.name,
      };
      io.to(conversationId).emit('game:rejected', payload);
      if (invite?.sender?.id) {
        io.to(`user:${invite.sender.id}`).emit('game:rejected', payload);
      }
      console.log(`[Game] Invitation in room ${conversationId} rejected by ${socket.user.name}`);
    });

    // D. Make a move on the board
    socket.on('game:move', async ({ gameId, cellIndex }, callback) => {
      try {
        const result = gameManager.playMove(gameId, userId, cellIndex);

        if (!result.success) {
          if (callback) callback({ success: false, message: result.message });
          return;
        }

        const updatedGame = result.game;
        const playerXId = (updatedGame.players.X.id || updatedGame.players.X._id).toString();
        const playerOId = (updatedGame.players.O.id || updatedGame.players.O._id).toString();

        // Broadcast updated game state to conversation room AND to both player rooms
        io.to(updatedGame.conversationId).emit('game:updated', updatedGame);
        io.to(`user:${playerXId}`).emit('game:updated', updatedGame);
        io.to(`user:${playerOId}`).emit('game:updated', updatedGame);

        if (callback) callback({ success: true, game: updatedGame });

        // If next turn is Chatbot, execute bot move automatically
        try {
          if (updatedGame.status === 'in_progress') {
            const nextPlayer = updatedGame.players[updatedGame.turn];
            if (nextPlayer?.id) {
              const nextPlayerUser = await User.findById(nextPlayer.id);
              if (nextPlayerUser?.isBot || nextPlayerUser?.email === 'chatbot@chatplay.ai') {
                setTimeout(() => {
                  const currentLive = gameManager.getGame(gameId);
                  if (currentLive && currentLive.status === 'in_progress' && currentLive.turn === updatedGame.turn) {
                    const freeIndices = currentLive.board
                      .map((val, idx) => (val === null ? idx : null))
                      .filter((v) => v !== null);

                    if (freeIndices.length > 0) {
                      const chosen = freeIndices.includes(4)
                        ? 4
                        : freeIndices[Math.floor(Math.random() * freeIndices.length)];
                      const botResult = gameManager.playMove(gameId, nextPlayer.id, chosen);
                      if (botResult.success) {
                        const botGame = botResult.game;
                        io.to(botGame.conversationId).emit('game:updated', botGame);
                        io.to(`user:${playerXId}`).emit('game:updated', botGame);
                        io.to(`user:${playerOId}`).emit('game:updated', botGame);
                        console.log(`[Game] Chatbot placed ${currentLive.turn} at cell ${chosen}`);
                      }
                    }
                  }
                }, 700);
              }
            }
          }
        } catch (botMoveErr) {
          console.warn('Bot move error:', botMoveErr.message);
        }
      } catch (err) {
        console.error('Error playing game move:', err.message);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // E. Request a Rematch / Play Again
    socket.on('game:rematch', ({ gameId }) => {
      const updatedGame = gameManager.rematch(gameId);
      if (updatedGame) {
        const playerXId = (updatedGame.players.X.id || updatedGame.players.X._id).toString();
        const playerOId = (updatedGame.players.O.id || updatedGame.players.O._id).toString();

        io.to(updatedGame.conversationId).emit('game:updated', updatedGame);
        io.to(`user:${playerXId}`).emit('game:updated', updatedGame);
        io.to(`user:${playerOId}`).emit('game:updated', updatedGame);

        console.log(`[Game] Rematch started for game ${gameId}`);
      }
    });

    // F. Exit / Leave Game
    socket.on('game:exit', ({ gameId }) => {
      const endedGame = gameManager.endGame(gameId);
      if (endedGame) {
        const playerXId = (endedGame.players.X.id || endedGame.players.X._id).toString();
        const playerOId = (endedGame.players.O.id || endedGame.players.O._id).toString();
        const payload = {
          gameId,
          exitedBy: socket.user.name,
        };

        io.to(endedGame.conversationId).emit('game:ended', payload);
        io.to(`user:${playerXId}`).emit('game:ended', payload);
        io.to(`user:${playerOId}`).emit('game:ended', payload);

        console.log(`[Game] Game ${gameId} ended by ${socket.user.name}`);
      }
    });

    // 8. Disconnection cleanup
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.user.name} (${socket.id})`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          const now = new Date();
          try {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: now,
            });
          } catch (dbErr) {
            console.warn('Could not update user offline status in DB:', dbErr.message);
          }

          // Broadcast offline event
          io.emit('user:offline', {
            userId,
            isOnline: false,
            lastSeen: now,
          });
        }
      }
    });
  });

  return io;
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());
