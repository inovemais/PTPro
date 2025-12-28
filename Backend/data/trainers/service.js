function TrainerService(TrainerModel) {
  const service = {
    create,
    update,
    findById,
    findAll,
    removeById,
    findByUserId,
  };

  /**
   * Create a new trainer profile
   * @param {Object} trainer - Trainer data
   * @returns {Promise} Created trainer
   */
  function create(trainer) {
    return new Promise(function (resolve, reject) {
      // Validate required fields
      if (!trainer.userId) {
        return reject(new Error("userId is required"));
      }

      // Check if trainer already exists for this user
      TrainerModel.findOne({ userId: trainer.userId })
        .then((existing) => {
          if (existing) {
            return reject(new Error("Trainer profile already exists for this user"));
          }

          // Create new trainer
          const model = new TrainerModel(trainer);
          return save(model);
        })
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  /**
   * Save trainer model to database
   * @param {Object} model - Mongoose model instance
   * @returns {Promise} Saved trainer
   */
  function save(model) {
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) {
          return reject(err);
        }

        resolve({
          message: "Trainer created",
          trainer: model,
        });
      });
    });
  }

  /**
   * Update trainer by ID
   * @param {String} id - Trainer ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated trainer
   */
  function update(id, data) {
    return new Promise(function (resolve, reject) {
      // Validate ID
      if (!id) {
        return reject(new Error("Trainer ID is required"));
      }

      // Find trainer first to ensure it exists
      TrainerModel.findById(id)
        .then((existing) => {
          if (!existing) {
            return reject(new Error("Trainer not found"));
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

          // Update trainer
          return TrainerModel.findByIdAndUpdate(
            id,
            cleanData,
            { new: true, runValidators: true }
          ).populate("userId");
        })
        .then((updated) => {
          if (!updated) {
            return reject(new Error("Trainer not found"));
          }
          resolve(updated);
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Find trainer by ID
   * @param {String} id - Trainer ID
   * @returns {Promise} Trainer object
   */
  function findById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Trainer ID is required"));
      }

      TrainerModel.findById(id)
        .populate("userId")
        .exec(function (err, trainer) {
          if (err) return reject(err);
          if (!trainer) {
            return reject(new Error("Trainer not found"));
          }
          resolve(trainer);
        });
    });
  }

  /**
   * Find trainer by userId
   * @param {String} userId - User ID
   * @returns {Promise} Trainer object
   */
  function findByUserId(userId) {
    return new Promise(function (resolve, reject) {
      if (!userId) {
        return reject(new Error("User ID is required"));
      }

      TrainerModel.findOne({ userId })
        .populate("userId")
        .exec(function (err, trainer) {
          if (err) return reject(err);
          resolve(trainer); // Can be null if not found
        });
    });
  }

  /**
   * Find all trainers with filters and pagination
   * @param {Object} query - Query filters { search, sort, onlyValidated, isActive }
   * @param {Object} pagination - Pagination { limit, skip }
   * @returns {Promise} Object with trainers array and pagination info
   */
  function findAll(query, pagination) {
    const { search, sort, onlyValidated, isActive } = query;
    const { limit, skip } = pagination;

    const criteria = {};

    // Filter by validation status
    if (onlyValidated === true || onlyValidated === "true") {
      criteria.isValidated = true;
    }

    // Filter by active status
    if (isActive !== undefined) {
      criteria.isActive = isActive === true || isActive === "true";
    }

    // Search in multiple fields
    if (search) {
      criteria.$or = [
        { specialties: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        // Note: To search in user name/email, would need aggregation
        // For now, keeping it simple
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
        TrainerModel.find(criteria)
          .populate("userId")
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .exec(),
        TrainerModel.countDocuments(criteria),
      ])
        .then(([trainers, total]) => {
          resolve({
            trainers,
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
   * Remove trainer by ID
   * @param {String} id - Trainer ID
   * @returns {Promise} Success message
   */
  function removeById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Trainer ID is required"));
      }

      // First check if trainer exists
      TrainerModel.findById(id)
        .then((trainer) => {
          if (!trainer) {
            return reject(new Error("Trainer not found"));
          }

          // Use findByIdAndDelete (modern method)
          return TrainerModel.findByIdAndDelete(id);
        })
        .then(() => {
          resolve({ message: "Trainer deleted successfully" });
        })
        .catch((err) => reject(err));
    });
  }

  return service;
}

module.exports = TrainerService;
