const Messages = require("../../../../data/messages");
const Message = Messages.Message;

const service = Messages.MessageService;

// Add method to get all conversation threads for a user
service.getThreads = function (userId) {
  return new Promise((resolve, reject) => {
    Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userId] },
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
                    { $eq: ["$receiverId", userId] },
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
        $unwind: "$user",
      },
      {
        $project: {
          userId: "$_id",
          userName: "$user.name",
          userEmail: "$user.email",
          lastMessage: 1,
          unreadCount: 1,
        },
      },
    ]).exec((err, threads) => {
      if (err) return reject(err);
      resolve(threads);
    });
  });
};

module.exports = service;

