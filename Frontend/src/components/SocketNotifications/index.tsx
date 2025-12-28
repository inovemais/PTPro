import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import scopes from '../../data/users/scopes';

const SocketNotifications: React.FC = () => {
  const { user, scopes: userScopes } = useAuth();

  useEffect(() => {
    const socket = getSocket();

    socket.on('chat:new_message', (message: any) => {
      // Only show notification if message is for current user
      if (message.receiverId?._id === user?.id || message.receiverId === user?.id) {
        toast.info(`New message from ${message.senderId?.name || 'Someone'}`, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    });

    socket.on('client:missed_workout', (data: any) => {
      // Only show notification if user is a trainer
      if (userScopes?.includes(scopes.PersonalTrainer)) {
        toast.warning(`Client missed a workout: ${data.reason || 'No reason provided'}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    });

    return () => {
      socket.off('chat:new_message');
      socket.off('client:missed_workout');
    };
  }, [user, userScopes]);

  return null;
};

export default SocketNotifications;
