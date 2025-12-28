let WorkoutLog = require("./workoutLog");
let workoutPlanModule = require("./workoutPlan");
let WorkoutPlan = workoutPlanModule.WorkoutPlan;

function WorkoutService() {
  const service = {
    createPlan,
    updatePlan,
    findPlanById,
    findPlans,
    removePlanById,
    createLog,
    updateLog,
    findLogs,
    findLogById,
    statsByPeriod,
  };

  // ==================== WORKOUT PLANS ====================

  /**
   * Create a new workout plan
   * @param {Object} plan - Plan data { name, description, trainerId, clientId, frequencyPerWeek, startDate }
   * @returns {Promise} Created plan
   */
  function createPlan(plan) {
    return new Promise(function (resolve, reject) {
      // Validate required fields
      if (!plan.name || plan.name.trim() === "") {
        return reject(new Error("Plan name is required"));
      }
      if (!plan.trainerId) {
        return reject(new Error("trainerId is required"));
      }
      if (!plan.clientId) {
        return reject(new Error("clientId is required"));
      }

      const model = new WorkoutPlan(plan);
      return save(model);
    });
  }

  /**
   * Save workout plan model to database
   * @param {Object} model - Mongoose model instance
   * @returns {Promise} Saved plan
   */
  function save(model) {
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) {
          return reject(err);
        }

        resolve({
          message: "Workout plan created",
          plan: model,
        });
      });
    });
  }

  /**
   * Update workout plan by ID
   * @param {String} id - Plan ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated plan
   */
  function updatePlan(id, data) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Plan ID is required"));
      }

      // Find plan first to ensure it exists
      WorkoutPlan.findById(id)
        .then((existing) => {
          if (!existing) {
            return reject(new Error("Plan not found"));
          }

          // Clean undefined fields
          const cleanData = {};
          Object.keys(data).forEach((key) => {
            if (data[key] !== undefined) {
              cleanData[key] = data[key];
            }
          });

          // Don't allow updating trainerId or clientId (should be immutable)
          if (cleanData.trainerId && cleanData.trainerId !== existing.trainerId.toString()) {
            return reject(new Error("Cannot change trainerId"));
          }
          if (cleanData.clientId && cleanData.clientId !== existing.clientId.toString()) {
            return reject(new Error("Cannot change clientId"));
          }

          // Update plan
          return WorkoutPlan.findByIdAndUpdate(
            id,
            cleanData,
            { new: true, runValidators: true }
          )
            .populate("trainerId")
            .populate("clientId");
        })
        .then((updated) => {
          if (!updated) {
            return reject(new Error("Plan not found"));
          }
          resolve(updated);
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Find workout plan by ID
   * @param {String} id - Plan ID
   * @returns {Promise} Plan object
   */
  function findPlanById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Plan ID is required"));
      }

      WorkoutPlan.findById(id)
        .populate("trainerId")
        .populate("clientId")
        .exec(function (err, plan) {
          if (err) return reject(err);
          if (!plan) {
            return reject(new Error("Plan not found"));
          }
          resolve(plan);
        });
    });
  }

  /**
   * Find all workout plans with filters and pagination
   * @param {Object} query - Query filters { search, sort, clientId, trainerId, isActive }
   * @param {Object} pagination - Pagination { limit, skip }
   * @returns {Promise} Object with plans array and pagination info
   */
  function findPlans(query, pagination) {
    const { search, sort, clientId, trainerId, isActive } = query;
    const { limit, skip } = pagination;

    const criteria = {};

    if (clientId) criteria.clientId = clientId;
    if (trainerId) criteria.trainerId = trainerId;
    if (typeof isActive !== "undefined") {
      criteria.isActive = isActive === true || isActive === "true";
    }

    if (search) {
      criteria.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

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
        WorkoutPlan.find(criteria)
          .populate("trainerId")
          .populate("clientId")
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .exec(),
        WorkoutPlan.countDocuments(criteria),
      ])
        .then(([plans, total]) => {
          resolve({
            plans,
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
   * Remove workout plan by ID
   * @param {String} id - Plan ID
   * @returns {Promise} Success message
   */
  function removePlanById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Plan ID is required"));
      }

      // First check if plan exists
      WorkoutPlan.findById(id)
        .then((plan) => {
          if (!plan) {
            return reject(new Error("Plan not found"));
          }

          // Use findByIdAndDelete (modern method)
          return WorkoutPlan.findByIdAndDelete(id);
        })
        .then(() => {
          resolve({ message: "Workout plan deleted successfully" });
        })
        .catch((err) => reject(err));
    });
  }

  // ==================== WORKOUT LOGS ====================

  /**
   * Create a new workout log
   * @param {Object} log - Log data { workoutPlanId, clientId, trainerId, date, status, notes }
   * @returns {Promise} Created log
   */
  function createLog(log) {
    return new Promise(function (resolve, reject) {
      // Validate required fields
      if (!log.workoutPlanId) {
        return reject(new Error("workoutPlanId is required"));
      }
      if (!log.clientId) {
        return reject(new Error("clientId is required"));
      }
      if (!log.date) {
        return reject(new Error("date is required"));
      }
      if (!log.status) {
        return reject(new Error("status is required"));
      }

      // Validate status
      const validStatuses = ["completed", "missed", "partial"];
      if (!validStatuses.includes(log.status)) {
        return reject(
          new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`)
        );
      }

      const model = new WorkoutLog(log);
      model.save(function (err, savedLog) {
        if (err) return reject(err);
        resolve({
          message: "Workout log created",
          log: savedLog,
        });
      });
    });
  }

  /**
   * Update workout log by ID
   * @param {String} id - Log ID
   * @param {Object} data - Update data
   * @returns {Promise} Updated log
   */
  function updateLog(id, data) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Log ID is required"));
      }

      // Find log first to ensure it exists
      WorkoutLog.findById(id)
        .then((existing) => {
          if (!existing) {
            return reject(new Error("Log not found"));
          }

          // Clean undefined fields
          const cleanData = {};
          Object.keys(data).forEach((key) => {
            if (data[key] !== undefined) {
              cleanData[key] = data[key];
            }
          });

          // Validate status if provided
          if (cleanData.status) {
            const validStatuses = ["completed", "missed", "partial"];
            if (!validStatuses.includes(cleanData.status)) {
              return reject(
                new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`)
              );
            }
          }

          // Update log
          return WorkoutLog.findByIdAndUpdate(
            id,
            cleanData,
            { new: true, runValidators: true }
          );
        })
        .then((updated) => {
          if (!updated) {
            return reject(new Error("Log not found"));
          }
          resolve(updated);
        })
        .catch((err) => reject(err));
    });
  }

  /**
   * Find all workout logs with filters and pagination
   * @param {Object} query - Query filters { clientId, trainerId, workoutPlanId, from, to }
   * @param {Object} pagination - Pagination { limit, skip }
   * @returns {Promise} Object with logs array and pagination info
   */
  function findLogs(query, pagination) {
    const { clientId, trainerId, workoutPlanId, from, to } = query;
    const { limit, skip } = pagination;

    const criteria = {};

    if (clientId) criteria.clientId = clientId;
    if (trainerId) criteria.trainerId = trainerId;
    if (workoutPlanId) criteria.workoutPlanId = workoutPlanId;

    if (from || to) {
      criteria.date = {};
      if (from) criteria.date.$gte = new Date(from);
      if (to) criteria.date.$lte = new Date(to);
    }

    return new Promise(function (resolve, reject) {
      // Use Promise.all for parallel execution
      Promise.all([
        WorkoutLog.find(criteria)
          .populate("workoutPlanId")
          .populate("clientId")
          .populate("trainerId")
          .sort({ date: -1 }) // Most recent first
          .skip(skip)
          .limit(limit)
          .exec(),
        WorkoutLog.countDocuments(criteria),
      ])
        .then(([logs, total]) => {
          resolve({
            logs,
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
   * Find workout log by ID
   * @param {String} id - Log ID
   * @returns {Promise} Log object
   */
  function findLogById(id) {
    return new Promise(function (resolve, reject) {
      if (!id) {
        return reject(new Error("Log ID is required"));
      }

      WorkoutLog.findById(id)
        .populate("workoutPlanId")
        .populate("clientId")
        .populate("trainerId")
        .exec(function (err, log) {
          if (err) return reject(err);
          if (!log) {
            return reject(new Error("Log not found"));
          }
          resolve(log);
        });
    });
  }

  /**
   * Get statistics by period (week/month)
   * @param {Object} query - Query filters { clientId, period }
   * @returns {Promise} Aggregated statistics
   */
  function statsByPeriod(query) {
    return new Promise(function (resolve, reject) {
      const { clientId, period } = query;

      // Validate period
      if (period && !["week", "month"].includes(period)) {
        return reject(new Error('Period must be "week" or "month"'));
      }

      const match = {};
      if (clientId) match.clientId = clientId;

      WorkoutLog.aggregate([
        { $match: match },
        {
          $group: {
            _id:
              period === "month"
                ? { year: { $year: "$date" }, month: { $month: "$date" } }
                : { year: { $year: "$date" }, week: { $isoWeek: "$date" } },
            totalCompleted: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
            totalMissed: {
              $sum: {
                $cond: [{ $eq: ["$status", "missed"] }, 1, 0],
              },
            },
            totalPartial: {
              $sum: {
                $cond: [{ $eq: ["$status", "partial"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.week": 1, "_id.month": 1 } },
      ])
        .then((stats) => resolve(stats))
        .catch((err) => reject(err));
    });
  }

  return service;
}

module.exports = WorkoutService;
