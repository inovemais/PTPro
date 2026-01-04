import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  // Determine socket URL
  // In development/localhost, ALWAYS use proxy (undefined) to connect to local server
  // This ensures we use the local server even if VITE_SOCKET_URL or VITE_API_URL is set
  let socketUrl: string | undefined;
  if (isLocalhost || isDevelopment) {
    socketUrl = undefined; // Use proxy
  } else {
    socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://ptpro.onrender.com';
  }

  socketInstance = io(socketUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

