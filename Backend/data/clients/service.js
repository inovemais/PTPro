function ClientService(ClientModel) {
  const service = {
    create,
    update,
    findById,
    findAll,
    findByUserId,
    removeById,
    assignToTrainer,
  };

  /**
   * Create a new client profile
   * @param {Object} client - Client data
   * @returns {Promise} Created client
   */
  function create(client) {
    return new Promise(function (resolve, reject) {
      // Validate required fields
      if (!client.userId) {
        return reject(new Error("userId is required"));
      }

      // Check if client already exists for this user
      ClientModel.findOne({ userId: client.userId })
        .then((existing) => {
          if (existing) {
            return reject(new Error("Client profile already exists for this user"));
          }

          // Create new client
          const model = new ClientModel(client);
          return save(model);
        })
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  /**
   * Save client model to database
   * @param {Object} model - Mongoose model instance
   * @returns {Promise} Saved client
   */
  function save(model) {
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) {
          return reject(err);
        }

        resolve({
          message: "Client created",
          client: model,
        });
      });
    });
  }

  /**
   * Update client by ID
   * @param {String} id - Client ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated client
   */
  function update(id, data) {
    return new Promise(function (resolve, reject) {
      // Validate ID
      if (!id) {
        return reject(new Error("Client ID is required"));
      }

      // Find client first to ensure it exists
      ClientModel.findById(id)
        .then((existing) => {
          if (!existing) {
            return reject(new Error("Client not found"));
          }

          // Clean undefined fields
          const cleanData = {};
          Object.keys(data).forEach((key) => {
            if (data[key] !== undefined) {
              cleanData[key] = data[key];
            }
          });

          // Don't allow updating userId (should be immutable)
          if (cleanData.userId && cleanData.userId !== existing.userId.toString()) {
            return reject(new Error("Cannot change userId"));
          }

          // Update client
          return ClientModel.findByIdAndUpdate(
            id,
            cleanData,
            { new: true, runValidators: true }
          )
            .populate("userId")
            .populate({
              path: "trainerId",
              populate: {
                path: "userId",
                select: "name email"
              }
            });
        })
        .then((updated) => {
          if (!updated) {
            return reject(new Error("Client not found"));
          }
          resolve(updated);
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Find client by ID
   * @param {String} id - Client ID
   * @returns {Promise} Client object
   */
  function findById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Client ID is required"));
      }

      ClientModel.findById(id)
        .populate("userId")
        .populate({
          path: "trainerId",
          populate: {
            path: "userId",
            select: "name email"
          }
        })
        .exec(function (err, client) {
          if (err) return reject(err);
          if (!client) {
            return reject(new Error("Client not found"));
          }
          resolve(client);
        });
    });
  }

  /**
   * Find client by userId
   * @param {String} userId - User ID
   * @returns {Promise} Client object or null
   */
  function findByUserId(userId) {
    return new Promise(function (resolve, reject) {
      if (!userId) {
        return reject(new Error("User ID is required"));
      }

      ClientModel.findOne({ userId })
        .populate("userId")
        .populate({
          path: "trainerId",
          populate: {
            path: "userId",
            select: "name email"
          }
        })
        .exec(function (err, client) {
          if (err) return reject(err);
          resolve(client); // Can be null if not found
        });
    });
  }

  /**
   * Find all clients with filters and pagination
   * @param {Object} query - Query filters { search, sort, trainerId, isValidated }
   * @param {Object} pagination - Pagination { limit, skip }
   * @returns {Promise} Object with clients array and pagination info
   */
  function findAll(query, pagination) {
    const { search, sort, trainerId, isValidated } = query;
    const { limit, skip } = pagination;

    const criteria = {};

    // Filter by trainer
    if (trainerId) {
      criteria.trainerId = trainerId;
    }

    // Filter by validation status
    if (isValidated !== undefined) {
      criteria.isValidated = isValidated;
    }

    // Search in multiple fields
    if (search) {
      criteria.$or = [
        { goal: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sortObj = {};
    if (sort) {
      const fields = sort.split(",");
      fields.forEach((field) => {
        if (!field) return;
        if (field.startsWith("-")) {
          sortObj[field.substring(1)] = -1;
        } else {
          sortObj[field] = 1;
        }
      });
    } else {
      sortObj.createdAt = -1; // Default: newest first
    }

    return new Promise(function (resolve, reject) {
      // Use Promise.all for parallel execution
      Promise.all([
        ClientModel.find(criteria)
          .populate("userId")
          .populate({
            path: "trainerId",
            populate: {
              path: "userId",
              select: "name email"
            }
          })
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .exec(),
        ClientModel.countDocuments(criteria),
      ])
        .then(([clients, total]) => {
          resolve({
            clients,
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
   * Remove client by ID
   * @param {String} id - Client ID
   * @returns {Promise} Success message
   */
  function removeById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Client ID is required"));
      }

      // First check if client exists
      ClientModel.findById(id)
        .then((client) => {
          if (!client) {
            return reject(new Error("Client not found"));
          }

          // Use findByIdAndDelete (modern method)
          return ClientModel.findByIdAndDelete(id);
        })
        .then(() => {
          resolve({ message: "Client deleted successfully" });
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Assign a client to a trainer
   * Ensures client can only have one trainer
   * @param {String} clientId - Client ID
   * @param {String} trainerId - Trainer ID
   * @returns {Promise} Updated client
   */
  function assignToTrainer(clientId, trainerId) {
    return new Promise(function (resolve, reject) {
      if (!clientId) {
        return reject(new Error("Client ID is required"));
      }
      if (!trainerId) {
        return reject(new Error("Trainer ID is required"));
      }

      // Find client first
      ClientModel.findById(clientId)
        .populate("userId")
        .populate({
          path: "trainerId",
          populate: {
            path: "userId",
            select: "name email"
          }
        })
        .then((client) => {
          if (!client) {
            return reject(new Error("Client not found"));
          }

          // Check if client already has a trainer
          if (client.trainerId && client.trainerId.toString() !== trainerId) {
            return reject(
              new Error(
                "Client already has a trainer assigned. Each client can only have one trainer."
              )
            );
          }

          // If client already has this trainer, just return
          if (client.trainerId && client.trainerId.toString() === trainerId) {
            return resolve(client);
          }

          // Update trainer
          client.trainerId = trainerId;
          return client.save();
        })
        .then((updated) => {
          return ClientModel.findById(updated._id)
            .populate("userId")
            .populate({
              path: "trainerId",
              populate: {
                path: "userId",
                select: "name email"
              }
            });
        })
        .then((client) => {
          resolve(client);
        })
        .catch((err) => reject(err));
    });
  }

  return service;
}

module.exports = ClientService;
