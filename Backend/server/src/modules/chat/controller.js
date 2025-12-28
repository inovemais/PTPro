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

    // Emit Socket.IO event
    const io = req.app.get("io");
    if (io) {
      io.to(String(receiverId)).emit("chat:new_message", message);
    }

    sendSuccess(res, message, {}, 201);
  } catch (error) {
    sendError(res, error, 500);
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

    sendSuccess(res, result.messages, {
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function getThreads(req, res) {
  try {
    const userId = req.decoded?.id;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }

    const threads = await service.getThreads(userId);
    sendSuccess(res, threads);
  } catch (error) {
    sendError(res, error, 500);
  }
}

module.exports = {
  sendMessage,
  getConversation,
  getThreads,
};

