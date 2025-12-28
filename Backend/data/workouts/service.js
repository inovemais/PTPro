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
    statsByPeriod,
  };

  function createPlan(plan) {
    const model = new WorkoutPlan(plan);
    return save(model);
  }

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

  function updatePlan(id, data) {
    return new Promise(function (resolve, reject) {
      WorkoutPlan.findByIdAndUpdate(id, data, { new: true }, function (err, updated) {
        if (err) return reject(err);
        resolve(updated);
      });
    });
  }

  function findPlanById(id) {
    return new Promise(function (resolve, reject) {
      WorkoutPlan.findById(id)
        .populate("trainerId")
        .populate("clientId")
        .exec(function (err, plan) {
          if (err) return reject(err);
          resolve(plan);
        });
    });
  }

  function findPlans(query, pagination) {
    const { search, sort, clientId, trainerId, isActive } = query;
    const { limit, skip } = pagination;

    const criteria = {};

    if (clientId) criteria.clientId = clientId;
    if (trainerId) criteria.trainerId = trainerId;
    if (typeof isActive !== "undefined") criteria.isActive = isActive === "true";

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
      sortObj.createdAt = -1;
    }

    return new Promise(function (resolve, reject) {
      WorkoutPlan.find(criteria)
        .populate("trainerId")
        .populate("clientId")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(async function (err, plans) {
          if (err) return reject(err);

          const total = await WorkoutPlan.countDocuments(criteria);
          resolve({
            plans,
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

  function removePlanById(id) {
    return new Promise(function (resolve, reject) {
      WorkoutPlan.findByIdAndRemove(id, function (err) {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }

  function createLog(log) {
    const model = new WorkoutLog(log);
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) return reject(err);
        resolve({
          message: "Workout log created",
          log: model,
        });
      });
    });
  }

  function updateLog(id, data) {
    return new Promise(function (resolve, reject) {
      WorkoutLog.findByIdAndUpdate(id, data, { new: true }, function (err, updated) {
        if (err) return reject(err);
        resolve(updated);
      });
    });
  }

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
      WorkoutLog.find(criteria)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .exec(async function (err, logs) {
          if (err) return reject(err);

          const total = await WorkoutLog.countDocuments(criteria);
          resolve({
            logs,
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

  // Estatísticas para dashboards (por semana/mês)
  function statsByPeriod(query) {
    const { clientId, period } = query;

    const match = {};
    if (clientId) match.clientId = clientId;

    return WorkoutLog.aggregate([
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
    ]);
  }

  return service;
}

module.exports = WorkoutService;


