import User from '../models/User.js';

export const seedInitialUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return;

    console.log('[Database] Seeding initial demo contacts matching UI mockup...');

    const demoUsers = [
      {
        name: 'Talan Septimus',
        email: 'talan@chatplay.com',
        password: 'password123',
        profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
        bio: 'Loving the dark purple vibes! Let\'s build something great together.',
        isOnline: true,
      },
      {
        name: 'Aubrey Webb',
        email: 'aubrey@chatplay.com',
        password: 'password123',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        bio: 'Full stack enthusiast. Always down for Tic-Tac-Toe.',
        isOnline: true,
      },
      {
        name: 'Kathryn Richards',
        email: 'kathryn@chatplay.com',
        password: 'password123',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        bio: 'Design & UI/UX engineer. Dark theme maximalist.',
        isOnline: false,
      },
      {
        name: 'Bruce Warren',
        email: 'bruce@chatplay.com',
        password: 'password123',
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
        bio: 'Ready for challenge matches anytime.',
        isOnline: true,
      },
    ];

    for (const u of demoUsers) {
      await User.create(u);
    }

    console.log('[Database] 4 Demo users created successfully.');
  } catch (err) {
    console.warn('[Database] Demo user seeding skipped:', err.message);
  }
};

