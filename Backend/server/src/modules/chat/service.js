const Messages = require("../../../../data/messages");
const Message = Messages.Message;
const mongoose = require("mongoose");

const service = Messages.MessageService;

// Add method to get all conversation threads for a user
service.getThreads = function (userId) {
  return new Promise((resolve, reject) => {
    // Convert userId to ObjectId if it's a string
    let userIdObjectId = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdObjectId = mongoose.Types.ObjectId(userId);
    }
    
    Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userIdObjectId }, { receiverId: userIdObjectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userIdObjectId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", userIdObjectId] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          userId: "$_id",
          userName: "$user.name",
          userEmail: "$user.email",
          lastMessage: {
            text: "$lastMessage.text",
            createdAt: "$lastMessage.createdAt",
            senderId: "$lastMessage.senderId",
          },
          unreadCount: 1,
        },
      },
    ]).exec((err, threads) => {
      if (err) return reject(err);
      // Convert userId (ObjectId) to string for consistent handling
      const normalizedThreads = threads.map((thread) => ({
        ...thread,
        userId: thread.userId ? String(thread.userId) : null,
      }));
      resolve(normalizedThreads);
    });
  });
};

module.exports = service;

