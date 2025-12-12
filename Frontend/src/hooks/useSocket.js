import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";

/**
 * Hook para gerir conexão Socket.IO e eventos
 * @param {string|undefined} url - URL do servidor Socket.IO. 
 *   Se undefined ou vazio, usa a origem atual (proxy do Vite em dev)
 *   Default: undefined (usa proxy em dev, ou window.location.origin em prod)
 * @param {object} options - Opções de configuração do Socket.IO
 * @returns {object} - { socket, socketAddListener, socketRemoveListener, isConnected }
 */
export const useSocket = (url = undefined, options = {}) => {
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map()); // Armazenar listeners para poder removê-los depois
  const [isConnected, setIsConnected] = useState(false);

  // Inicializar socket
  useEffect(() => {
    // Determinar URL do socket
    // Se url for undefined, vazio ou null, Socket.IO usa a origem atual (window.location.origin)
    // Isso permite usar o proxy do Vite em desenvolvimento
    const socketUrl = url && url.trim() !== "" ? url : undefined;
    
    // Criar conexão Socket.IO
    // Em desenvolvimento com Vite, usar undefined faz o Socket.IO conectar à origem atual
    // O proxy do Vite redireciona /socket.io para o backend
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"], // Tentar websocket primeiro, depois polling
      path: "/socket.io/", // Path padrão do Socket.IO (necessário para funcionar com proxy)
      ...options
    });

    const socket = socketRef.current;

    // Eventos de conexão
    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      setIsConnected(false);
    });

    // Cleanup ao desmontar
    return () => {
      // Remover todos os listeners registados
      listenersRef.current.forEach((handler, event) => {
        socket.off(event, handler);
      });
      listenersRef.current.clear();

      // Desconectar socket
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [url, JSON.stringify(options)]);

  /**
   * Adiciona um listener para um evento Socket.IO
   * @param {string} event - Nome do evento
   * @param {function} handler - Função callback para o evento
   */
  const socketAddListener = useCallback((event, handler) => {
    if (!socketRef.current) {
      console.warn("Socket not initialized. Cannot add listener for:", event);
      return;
    }

    // Verificar se já existe um listener para este evento
    if (listenersRef.current.has(event)) {
      console.warn(`Listener for event "${event}" already exists. Removing previous listener.`);
      socketRef.current.off(event, listenersRef.current.get(event));
    }

    // Adicionar novo listener
    socketRef.current.on(event, handler);
    listenersRef.current.set(event, handler);

    console.log(`Listener added for event: ${event}`);
  }, []);

  /**
   * Remove um listener de um evento Socket.IO
   * @param {string} event - Nome do evento
   */
  const socketRemoveListener = useCallback((event) => {
    if (!socketRef.current) {
      console.warn("Socket not initialized. Cannot remove listener for:", event);
      return;
    }

    const handler = listenersRef.current.get(event);
    if (handler) {
      socketRef.current.off(event, handler);
      listenersRef.current.delete(event);
      console.log(`Listener removed for event: ${event}`);
    } else {
      console.warn(`No listener found for event: ${event}`);
    }
  }, []);

  return {
    socket: socketRef.current,
    socketAddListener,
    socketRemoveListener,
    isConnected
  };
};

