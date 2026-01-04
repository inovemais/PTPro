const service = require("./service");
const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");

async function sendMessage(req, res) {
  try {
    const senderId = req.decoded?.id;
    if (!senderId) {
      return sendError(res, "User ID not found", 401);
    }

    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return sendValidationError(res, "receiverId and text are required");
    }

    if (senderId === receiverId) {
      return sendValidationError(res, "Cannot send message to yourself");
    }

    const message = await service.create({
      senderId,
      receiverId,
      text,
    });

    // Populate sender and receiver info for Socket.IO notification
    const Messages = require("../../../../data/messages");
    const populatedMessage = await Messages.Message.findById(message._id)
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .exec();

    // Emit Socket.IO event with populated message
    const io = req.app.get("io");
    if (io && populatedMessage) {
      // Convert to plain object for Socket.IO
      const messageData = populatedMessage.toObject ? populatedMessage.toObject() : populatedMessage;
      
      // Ensure receiverId is a string for socket room
      // Handle both populated (receiverId._id) and unpopulated (receiverId) formats
      const receiverIdFromPopulated = messageData.receiverId?._id 
        ? String(messageData.receiverId._id) 
        : null;
      const receiverIdOriginal = String(receiverId);
      const receiverIdForRoom = receiverIdFromPopulated || receiverIdOriginal;
      
      // Emit to the room
      io.to(receiverIdForRoom).emit("chat:new_message", messageData);
      
      // Also try emitting to the original receiverId format in case of mismatch
      if (receiverIdFromPopulated && receiverIdFromPopulated !== receiverIdOriginal) {
        io.to(receiverIdOriginal).emit("chat:new_message", messageData);
      }
    } else if (io) {
      // Fallback: emit even without populated message
      io.to(String(receiverId)).emit("chat:new_message", message);
    }

    // Return populated message if available, otherwise return the original
    return sendSuccess(res, populatedMessage || message, {}, 201);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function getConversation(req, res) {
  try {
    const userId = req.decoded?.id;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }

    const { userId: otherUserId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const result = await service.findConversation(
      userId,
      otherUserId,
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    // Mark unread messages as read when viewing conversation
    if (result.messages && result.messages.length > 0) {
      const Messages = require("../../../../data/messages");
      const unreadMessageIds = result.messages
        .filter((msg) => {
          const receiverId = msg.receiverId?._id?.toString() || msg.receiverId?.toString() || msg.receiverId;
          return receiverId === userId && !msg.read;
        })
        .map((msg) => msg._id);

      if (unreadMessageIds.length > 0) {
        try {
          await Messages.MessageService.markAsRead(unreadMessageIds);
          // Refresh messages to get updated read status
          const updatedResult = await service.findConversation(
            userId,
            otherUserId,
            { limit: parseInt(limit), skip: parseInt(skip) }
          );
          return sendSuccess(res, updatedResult.messages, {
            pagination: updatedResult.pagination,
          });
        } catch (markError) {
          console.error('Error marking messages as read:', markError);
          // Continue even if marking as read fails
        }
      }
    }

    return sendSuccess(res, result.messages, {
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function getThreads(req, res) {
  try {
    const userId = req.decoded?.id;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }

    // Get existing conversation threads
    const threads = await service.getThreads(userId);
    
    // For trainers, also include their clients even if no messages exist
    const role = req.decoded?.role || {};
    const userScopes = Array.isArray(role.scope) ? role.scope : role.scope ? [role.scope] : [];
    const scopes = require("../../../../data/users/scopes");
    const isTrainer = userScopes.includes(scopes.PersonalTrainer) || userScopes.includes("PersonalTrainer");
    
    if (isTrainer) {
      try {
        // Get trainer profile
        const Trainers = require("../../../../data/trainers");
        const trainer = await Trainers.TrainerService.findByUserId(userId);
        
        if (trainer) {
          // Get all clients assigned to this trainer (without isValidated filter to include all)
          const Clients = require("../../../../data/clients");
          const clientsResult = await Clients.ClientService.findAll(
            { trainerId: trainer._id },
            { limit: 100, skip: 0 }
          );
          
          // Get existing thread userIds (check both userId and otherUser._id formats)
          const existingThreadUserIds = new Set();
          threads.forEach((t) => {
            const threadUserId = t.userId 
              ? String(t.userId)
              : (t.otherUser && t.otherUser._id ? String(t.otherUser._id) : null);
            if (threadUserId) {
              existingThreadUserIds.add(threadUserId);
            }
          });
          
          // Add clients that don't have existing threads
          const clientThreads = [];
          if (clientsResult && clientsResult.clients && clientsResult.clients.length > 0) {
            clientsResult.clients.forEach((client) => {
              if (!client || !client.userId) {
                return;
              }
              
              // Handle both populated and unpopulated userId
              let clientUserId = null;
              let clientName = 'Unknown';
              let clientEmail = '';
              
              // When userId is populated by Mongoose, it's an object with _id, name, email, etc.
              // When it's not populated, it's just an ObjectId
              if (client.userId && typeof client.userId === 'object') {
                // Check if it's a populated user object (has _id property)
                if (client.userId._id) {
                  clientUserId = String(client.userId._id);
                  clientName = client.userId.name || 'Unknown';
                  clientEmail = client.userId.email || '';
                } else if (client.userId.toString) {
                  // It's an ObjectId (not populated)
                  clientUserId = String(client.userId);
                }
              }
              
              if (clientUserId) {
                if (!existingThreadUserIds.has(clientUserId)) {
                  clientThreads.push({
                    userId: clientUserId,
                    userName: clientName,
                    userEmail: clientEmail,
                    lastMessage: null,
                    unreadCount: 0,
                  });
                }
              }
            });
          }
          
          // Combine existing threads with client threads
          const allThreads = [...threads, ...clientThreads];
          return sendSuccess(res, allThreads);
        }
      } catch (trainerError) {
        // If error getting trainer clients, just return existing threads
        console.error('Error getting trainer clients for threads:', trainerError);
        console.error('Error stack:', trainerError.stack);
      }
    }
    
    return sendSuccess(res, threads);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function sendWorkoutMissedAlert(req, res) {
  try {
    const senderId = req.decoded?.id;
    if (!senderId) {
      return sendError(res, "User ID not found", 401);
    }

    const { clientId, text, workoutDate } = req.body;

    if (!clientId) {
      return sendValidationError(res, "clientId is required");
    }

    // Get client to verify trainer has access and get userId
    const Clients = require("../../../../data/clients");
    const client = await Clients.ClientService.findById(clientId);
    if (!client) {
      return sendError(res, "Client not found", 404);
    }

    // Verify the trainer is assigned to this client
    const Trainers = require("../../../../data/trainers");
    const trainer = await Trainers.TrainerService.findByUserId(senderId);
    if (!trainer) {
      return sendError(res, "Trainer profile not found", 404);
    }

    // Check if trainer is assigned to this client or if user is admin
    const role = req.decoded?.role || {};
    const userScopes = Array.isArray(role.scope) ? role.scope : role.scope ? [role.scope] : [];
    const scopes = require("../../../../data/users/scopes");
    const isAdmin = userScopes.includes(scopes.Admin) || userScopes.includes("admin") || userScopes.includes("Admin");
    if (!isAdmin && (!client.trainerId || client.trainerId.toString() !== trainer._id.toString())) {
      return sendError(res, "Unauthorized: Trainer not assigned to this client", 403);
    }

    // Get client's userId
    const receiverUserId = (client.userId && client.userId._id) 
      ? client.userId._id.toString() 
      : (client.userId ? client.userId.toString() : null);
    if (!receiverUserId) {
      return sendError(res, "Client userId not found", 404);
    }

    // Create alert message
    const alertText = text || (workoutDate 
      ? `Nota: Faltou ao treino de ${new Date(workoutDate).toLocaleDateString('pt-PT')}. Por favor, entre em contacto para discutirmos.`
      : "Nota: Faltou a um treino. Por favor, entre em contacto para discutirmos.");

    const message = await service.create({
      senderId,
      receiverId: receiverUserId,
      text: alertText,
    });

    // Populate sender and receiver info for Socket.IO notification
    const Messages = require("../../../../data/messages");
    const populatedMessage = await Messages.Message.findById(message._id)
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .exec();

    // Emit Socket.IO event with populated message
    const io = req.app.get("io");
    if (io && populatedMessage) {
      const messageData = populatedMessage.toObject ? populatedMessage.toObject() : populatedMessage;
      io.to(String(receiverUserId)).emit("chat:new_message", messageData);
    }

    return sendSuccess(res, populatedMessage || message, {}, 201);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

module.exports = {
  sendMessage,
  getConversation,
  getThreads,
  sendWorkoutMissedAlert,
};

