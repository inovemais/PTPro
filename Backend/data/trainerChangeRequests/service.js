function TrainerChangeRequestService(TrainerChangeRequestModel) {
  const service = {
    create,
    updateStatus,
    findAll,
    findById,
    removeById,
  };

  /**
   * Create a new trainer change request
   * @param {Object} request - Request data { clientId, currentTrainerId, requestedTrainerId, reason }
   * @returns {Promise} Created request
   */
  function create(request) {
    return new Promise(function (resolve, reject) {
      // Validate required fields
      if (!request.clientId) {
        return reject(new Error("clientId is required"));
      }
      if (!request.requestedTrainerId) {
        return reject(new Error("requestedTrainerId is required"));
      }

      // Prevent requesting the same trainer
      if (
        request.currentTrainerId &&
        request.currentTrainerId === request.requestedTrainerId
      ) {
        return reject(new Error("Cannot request the same trainer"));
      }

      const model = new TrainerChangeRequestModel({
        ...request,
        status: request.status || "pending", // Default status
      });

      model.save(function (err, savedRequest) {
        if (err) return reject(err);
        resolve(savedRequest);
      });
    });
  }

  /**
   * Update request status
   * @param {String} id - Request ID
   * @param {String} status - New status (pending, approved, rejected)
   * @returns {Promise} Updated request
   */
  function updateStatus(id, status) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Request ID is required"));
      }

      // Validate status
      const validStatuses = ["pending", "approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return reject(
          new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`)
        );
      }

      // Find request first to ensure it exists
      TrainerChangeRequestModel.findById(id)
        .then((existing) => {
          if (!existing) {
            return reject(new Error("Request not found"));
          }

          // Update status
          return TrainerChangeRequestModel.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
          )
            .populate("clientId")
            .populate("currentTrainerId")
            .populate("requestedTrainerId");
        })
        .then((updated) => {
          if (!updated) {
            return reject(new Error("Request not found"));
          }
          resolve(updated);
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Find all requests with filters and pagination
   * @param {Object} query - Query filters { status }
   * @param {Object} pagination - Pagination { limit, skip }
   * @returns {Promise} Object with requests array and pagination info
   */
  function findAll(query, pagination) {
    const { status } = query;
    const { limit, skip } = pagination;

    const criteria = {};
    if (status) {
      criteria.status = status;
    }

    return new Promise(function (resolve, reject) {
      // Use Promise.all for parallel execution
      Promise.all([
        TrainerChangeRequestModel.find(criteria)
          .populate("clientId")
          .populate("currentTrainerId")
          .populate("requestedTrainerId")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        TrainerChangeRequestModel.countDocuments(criteria),
      ])
        .then(([requests, total]) => {
          resolve({
            requests,
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
   * Find request by ID
   * @param {String} id - Request ID
   * @returns {Promise} Request object
   */
  function findById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Request ID is required"));
      }

      TrainerChangeRequestModel.findById(id)
        .populate("clientId")
        .populate("currentTrainerId")
        .populate("requestedTrainerId")
        .exec(function (err, request) {
          if (err) return reject(err);
          if (!request) {
            return reject(new Error("Request not found"));
          }
          resolve(request);
        });
    });
  }

  /**
   * Remove request by ID
   * @param {String} id - Request ID
   * @returns {Promise} Success message
   */
  function removeById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Request ID is required"));
      }

      // First check if request exists
      TrainerChangeRequestModel.findById(id)
        .then((request) => {
          if (!request) {
            return reject(new Error("Request not found"));
          }

          // Use findByIdAndDelete (modern method)
          return TrainerChangeRequestModel.findByIdAndDelete(id);
        })
        .then(() => {
          resolve({ message: "Request deleted successfully" });
        })
        .catch((err) => reject(err));
    });
  }

  return service;
}

module.exports = TrainerChangeRequestService;
