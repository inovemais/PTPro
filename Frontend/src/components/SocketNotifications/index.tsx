import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import scopes from '../../data/users/scopes';

const SocketNotifications: React.FC = () => {
  const { user, scopes: userScopes } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      console.log('[SocketNotifications] No user ID, skipping socket setup');
      return;
    }

    const socket = getSocket();

    // Ensure socket is connected before joining room
    if (socket.connected) {
      console.log('[SocketNotifications] Socket connected, joining room for user:', user.id);
      socket.emit('join', user.id);
    } else {
      console.log('[SocketNotifications] Socket not connected yet, waiting for connect event');
      socket.once('connect', () => {
        console.log('[SocketNotifications] Socket connected, joining room for user:', user.id);
        socket.emit('join', user.id);
      });
      
      // Also try immediately in case it connects quickly
      socket.emit('join', user.id);
    }

    const handleNewMessage = (message: any) => {
      console.log('[SocketNotifications] Received chat:new_message:', message);
      
      // Normalize IDs to strings for comparison
      const receiverId = String(message.receiverId?._id || message.receiverId || '');
      const currentUserId = String(user?.id || '');
      
      console.log('[SocketNotifications] Comparing IDs:', {
        receiverId,
        currentUserId,
        match: receiverId === currentUserId
      });
      
      // Only show notification if message is for current user
      if (receiverId === currentUserId) {
        const senderName = message.senderId?.name || message.senderId?._id?.name || 'Alguém';
        console.log('[SocketNotifications] Showing toast for message from:', senderName);
        toast.info(`Nova mensagem de ${senderName}`, {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        console.log('[SocketNotifications] Message not for current user, ignoring');
      }
    };

    socket.on('chat:new_message', handleNewMessage);

    const handleMissedWorkout = (data: any) => {
      // Only show notification if user is a trainer
      if (userScopes?.includes(scopes.PersonalTrainer)) {
        toast.warning(`Cliente faltou ao treino: ${data.reason || 'Sem motivo especificado'}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

    socket.on('client:missed_workout', handleMissedWorkout);

    const handleWorkoutStatusChanged = (data: any) => {
      // Only show notification if user is a trainer
      if (userScopes?.includes(scopes.PersonalTrainer)) {
        const clientName = data.clientName || 'Cliente';
        const date = new Date(data.date).toLocaleDateString('pt-PT');
        
        let message = '';
        let toastType: 'success' | 'warning' | 'info' = 'info';
        
        switch (data.status) {
          case 'completed':
            message = `${clientName} completou o treino de ${date}`;
            if (data.photo) {
              message += ' (com foto)';
            }
            toastType = 'success';
            break;
          case 'missed':
            message = `${clientName} faltou ao treino de ${date}`;
            if (data.reason) {
              message += `: ${data.reason}`;
            }
            toastType = 'warning';
            break;
          case 'partial':
            message = `${clientName} completou parcialmente o treino de ${date}`;
            toastType = 'info';
            break;
          default:
            message = `${clientName} alterou o estado do treino de ${date}`;
        }
        
        toast[toastType](message, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

    socket.on('client:workout_status_changed', handleWorkoutStatusChanged);

    return () => {
      console.log('[SocketNotifications] Cleaning up socket listeners');
      socket.off('chat:new_message', handleNewMessage);
      socket.off('client:missed_workout', handleMissedWorkout);
      socket.off('client:workout_status_changed', handleWorkoutStatusChanged);
    };
  }, [user?.id, userScopes]);

  return null;
};

export default SocketNotifications;
