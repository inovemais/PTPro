function MessageService(MessageModel) {
  const service = {
    create,
    markAsRead,
    findConversation,
  };

  function create(message) {
    const model = new MessageModel(message);
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) return reject(err);
        resolve(model);
      });
    });
  }

  function markAsRead(messageIds) {
    return new Promise(function (resolve, reject) {
      MessageModel.updateMany(
        { _id: { $in: messageIds } },
        { $set: { read: true } },
        function (err) {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  function findConversation(userAId, userBId, pagination) {
    const { limit, skip } = pagination;

    return new Promise(function (resolve, reject) {
      MessageModel.find({
        $or: [
          { senderId: userAId, receiverId: userBId },
          { senderId: userBId, receiverId: userAId },
        ],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(async function (err, messages) {
          if (err) return reject(err);

          const total = await MessageModel.countDocuments({
            $or: [
              { senderId: userAId, receiverId: userBId },
              { senderId: userBId, receiverId: userAId },
            ],
          });

          resolve({
            messages,
            pagination: {
              pageSize: limit,
              page: Math.floor(skip / limit),
              hasMore: skip + limit < total,
              total,
            },
          });
        });
    });
  }

  return service;
}

module.exports = MessageService;


