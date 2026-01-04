function MessageService(MessageModel) {
  const service = {
    create,
    markAsRead,
    findConversation,
    findById,
  };

  /**
   * Create a new message
   * @param {Object} message - Message data { senderId, receiverId, text }
   * @returns {Promise} Created message
   */
  function create(message) {
    return new Promise(function (resolve, reject) {
      // Validate required fields
      if (!message.senderId) {
        return reject(new Error("senderId is required"));
      }
      if (!message.receiverId) {
        return reject(new Error("receiverId is required"));
      }
      // Support both 'text' (current) and 'content' (legacy) for backward compatibility
      const messageText = message.text || message.content;
      if (!messageText || messageText.trim() === "") {
        return reject(new Error("text is required"));
      }

      // Prevent sending message to self
      if (message.senderId === message.receiverId) {
        return reject(new Error("Cannot send message to yourself"));
      }

      // Ensure we use 'text' field for the model
      const messageData = {
        senderId: message.senderId,
        receiverId: message.receiverId,
        text: messageText,
      };

      const model = new MessageModel(messageData);
      model.save(function (err, savedMessage) {
        if (err) return reject(err);
        resolve(savedMessage);
      });
    });
  }

  /**
   * Mark messages as read
   * @param {Array} messageIds - Array of message IDs
   * @returns {Promise} Success message
   */
  function markAsRead(messageIds) {
    return new Promise(function (resolve, reject) {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return reject(new Error("messageIds must be a non-empty array"));
      }

      // Validate all IDs are valid
      const invalidIds = messageIds.filter((id) => !id);
      if (invalidIds.length > 0) {
        return reject(new Error("Invalid message IDs provided"));
      }

      MessageModel.updateMany(
        { _id: { $in: messageIds } },
        { $set: { read: true } },
        function (err, result) {
          if (err) return reject(err);
          resolve({
            message: "Messages marked as read",
            modifiedCount: result.modifiedCount,
          });
        }
      );
    });
  }

  /**
   * Find conversation between two users
   * @param {String} userAId - First user ID
   * @param {String} userBId - Second user ID
   * @param {Object} pagination - Pagination { limit, skip }
   * @returns {Promise} Object with messages array and pagination info
   */
  function findConversation(userAId, userBId, pagination) {
    return new Promise(function (resolve, reject) {
      // Validate inputs
      if (!userAId) {
        return reject(new Error("userAId is required"));
      }
      if (!userBId) {
        return reject(new Error("userBId is required"));
      }
      if (!pagination || !pagination.limit || pagination.skip === undefined) {
        return reject(new Error("pagination with limit and skip is required"));
      }

      const { limit, skip } = pagination;

      const criteria = {
        $or: [
          { senderId: userAId, receiverId: userBId },
          { senderId: userBId, receiverId: userAId },
        ],
      };

      // Use Promise.all for parallel execution
      Promise.all([
        MessageModel.find(criteria)
          .populate("senderId", "name email")
          .populate("receiverId", "name email")
          .sort({ createdAt: 1 }) // Ascending order for chat (oldest first)
          .skip(skip)
          .limit(limit)
          .exec(),
        MessageModel.countDocuments(criteria),
      ])
        .then(([messages, total]) => {
          resolve({
            messages,
            pagination: {
              pageSize: limit,
              page: Math.floor(skip / limit) + 1, // 1-indexed page
              hasMore: skip + limit < total,
              total,
            },
          });
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Find message by ID
   * @param {String} id - Message ID
   * @returns {Promise} Message object
   */
  function findById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Message ID is required"));
      }

      MessageModel.findById(id)
        .populate("senderId")
        .populate("receiverId")
        .exec(function (err, message) {
          if (err) return reject(err);
          if (!message) {
            return reject(new Error("Message not found"));
          }
          resolve(message);
        });
    });
  }

  return service;
}

module.exports = MessageService;
