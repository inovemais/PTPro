const service = require("./service");
const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");

async function create(req, res) {
  try {
    const userId = req.decoded?.id;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }

    const { workoutPlanId, date, status, reason } = req.body;

    // Validation
    if (!workoutPlanId || !date || !status) {
      return sendValidationError(res, "workoutPlanId, date, and status are required");
    }

    if (!["completed", "missed", "partial"].includes(status)) {
      return sendValidationError(res, "status must be 'completed', 'missed', or 'partial'");
    }

    // If status is 'missed', reason is mandatory
    if (status === "missed" && !reason) {
      return sendValidationError(res, "reason is required when status is 'missed'");
    }

    // Get client profile
    const Clients = require("../../../../data/clients");
    const client = await Clients.ClientService.findByUserId(userId);
    if (!client) {
      return sendError(res, "Client profile not found", 404);
    }

    // Get plan to get trainerId
    const plan = await service.findPlanById(workoutPlanId);
    if (!plan) {
      return sendError(res, "Workout plan not found", 404);
    }

    const logData = {
      workoutPlanId,
      clientId: client._id,
      trainerId: plan.trainerId?._id || plan.trainerId,
      date,
      status,
      reason: status === "missed" ? reason : undefined,
    };

    // Handle file upload if present
    if (req.file) {
      logData.photo = `/uploads/workouts/${req.file.filename}`;
    }

    const result = await service.createLog(logData);

    // Emit Socket.IO event if workout was missed
    const io = req.app.get("io");
    if (io && status === "missed" && logData.trainerId) {
      io.to(String(logData.trainerId)).emit("client:missed_workout", {
        clientId: client._id,
        date,
        reason,
        logId: result.log._id,
      });
    }

    sendSuccess(res, result.log, {}, 201);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function update(req, res) {
  try {
    const userId = req.decoded?.id;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    // If updating to 'missed', reason is mandatory
    if (status === "missed" && !reason) {
      return sendValidationError(res, "reason is required when status is 'missed'");
    }

    const updateData = { status };
    if (reason) {
      updateData.reason = reason;
    }

    // Handle file upload if present
    if (req.file) {
      updateData.photo = `/uploads/workouts/${req.file.filename}`;
    }

    const log = await service.updateLog(id, updateData);
    if (!log) {
      return sendError(res, "Compliance log not found", 404);
    }

    // Emit Socket.IO event if workout was missed
    const io = req.app.get("io");
    if (io && status === "missed" && log.trainerId) {
      io.to(String(log.trainerId)).emit("client:missed_workout", {
        clientId: log.clientId,
        date: log.date,
        reason,
        logId: log._id,
      });
    }

    sendSuccess(res, log);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function list(req, res) {
  try {
    const { limit = 20, skip = 0, clientId, trainerId, workoutPlanId, from, to } = req.query;
    const result = await service.findLogs(
      { clientId, trainerId, workoutPlanId, from, to },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    sendSuccess(res, result.logs, {
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function stats(req, res) {
  try {
    const { clientId, period = "week" } = req.query;
    const stats = await service.statsByPeriod({ clientId, period });

    sendSuccess(res, stats);
  } catch (error) {
    sendError(res, error, 500);
  }
}

module.exports = {
  list,
  create,
  update,
  stats,
};
