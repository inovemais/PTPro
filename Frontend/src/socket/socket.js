import { io } from "socket.io-client";

/**
 * Configuração e criação da instância Socket.IO
 * Centraliza a configuração do socket para uso em toda a aplicação
 */

// URL do servidor Socket.IO
// No Vite, use import.meta.env em vez de process.env
// Variáveis de ambiente devem ter o prefixo VITE_ para serem expostas
// Em desenvolvimento, usar URL vazia ou undefined para usar o proxy do Vite
// Em produção, usar a URL completa do servidor
import { getApiBase } from '../config/api';

const getSocketUrl = () => {
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  console.log('🔌 getSocketUrl() called');
  console.log('🔌 Environment:', {
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    isProduction,
    VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL
  });
  
  // Se houver variável de ambiente específica, usar ela
  if (import.meta.env.VITE_SOCKET_URL) {
    console.log('🔌 Using VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // Em desenvolvimento, usar undefined para usar o proxy do Vite
  if (!isProduction) {
    console.log('🔌 Development mode: returning undefined (will use proxy)');
    return undefined;
  }
  
  // Em produção, usar a mesma base URL da API
  const apiBase = getApiBase();
  const finalUrl = apiBase || 'https://pwa-app-nudl.onrender.com';
  console.log('🔌 Production mode: returning', finalUrl);
  return finalUrl;
};

const SOCKET_URL = getSocketUrl();

// Opções de configuração do Socket.IO
const socketOptions = {
  withCredentials: true,
  transports: ["websocket", "polling"], // Tentar websocket primeiro, depois polling
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  timeout: 20000,
};

/**
 * Cria uma nova instância do Socket.IO
 * @param {object} customOptions - Opções personalizadas para sobrescrever as padrão
 * @returns {Socket} - Instância do Socket.IO
 */
export const createSocket = (customOptions = {}) => {
  const options = {
    ...socketOptions,
    ...customOptions,
  };

  // Se SOCKET_URL for undefined, Socket.IO usa a origem atual (window.location.origin)
  // Isso permite usar o proxy do Vite em desenvolvimento
  const socket = io(SOCKET_URL, options);

  // Eventos globais de conexão
  socket.on("connect", () => {
    console.log("Socket.IO connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket.IO disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("Socket.IO reconnected after", attemptNumber, "attempts");
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log("Socket.IO reconnection attempt:", attemptNumber);
  });

  socket.on("reconnect_error", (error) => {
    console.error("Socket.IO reconnection error:", error);
  });

  socket.on("reconnect_failed", () => {
    console.error("Socket.IO reconnection failed");
  });

  return socket;
};

/**
 * Instância singleton do socket (opcional - usar se quiser uma única instância global)
 * Descomente se quiser usar uma instância única em toda a aplicação
 */
// let socketInstance = null;

// export const getSocket = () => {
//   if (!socketInstance) {
//     socketInstance = createSocket();
//   }
//   return socketInstance;
// };

// export const disconnectSocket = () => {
//   if (socketInstance && socketInstance.connected) {
//     socketInstance.disconnect();
//     socketInstance = null;
//   }
// };

