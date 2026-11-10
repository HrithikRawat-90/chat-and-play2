import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  // In production or when hosted, automatically connect to the current origin
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:5173')) {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const createSocketConnection = (token) => {
  return io(getSocketUrl(), {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
};

