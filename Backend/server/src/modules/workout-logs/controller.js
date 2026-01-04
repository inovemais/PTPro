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
    let client;
    try {
      client = await Clients.ClientService.findByUserId(userId);
    } catch (clientError) {
      console.error('Error finding client:', clientError);
      return sendError(res, "Client profile not found", 404);
    }
    
    if (!client) {
      return sendError(res, "Client profile not found", 404);
    }

    // Get plan to get trainerId
    let plan;
    try {
      plan = await service.findPlanById(workoutPlanId);
    } catch (planError) {
      console.error('Error finding plan:', planError);
      return sendError(res, "Workout plan not found", 404);
    }
    
    if (!plan) {
      return sendError(res, "Workout plan not found", 404);
    }
    
    // Get trainerId - handle both populated and non-populated cases
    // When populated, trainerId is an object with _id
    // When not populated, trainerId is an ObjectId
    let trainerId = null;
    if (plan.trainerId) {
      // Check if it's populated (has _id property) or just an ObjectId
      if (plan.trainerId._id) {
        trainerId = plan.trainerId._id;
      } else if (plan.trainerId.toString) {
        // It's an ObjectId directly
        trainerId = plan.trainerId;
      }
    }
    
    // If trainerId is still null, try to get it from the plan's raw document
    if (!trainerId) {
      // Try to get the plan without populate to get the raw ObjectId
      const Workouts = require("../../../../data/workouts");
      const rawPlan = await Workouts.WorkoutPlan.findById(workoutPlanId).lean();
      if (rawPlan && rawPlan.trainerId) {
        trainerId = rawPlan.trainerId;
      }
    }
    
    if (!trainerId) {
      return sendError(res, "Workout plan does not have an associated trainer", 400);
    }

    const logData = {
      workoutPlanId,
      clientId: client._id,
      trainerId: trainerId,
      date: new Date(date), // Convert string to Date object
      status,
      reason: status === "missed" ? reason : undefined,
    };

    // Handle file upload if present
    if (req.file) {
      logData.photo = `/uploads/workouts/${req.file.filename}`;
    }

    const result = await service.createLog(logData);

    // Emit Socket.IO event to notify trainer about workout status change
    const io = req.app.get("io");
    if (io && logData.trainerId) {
      // Get trainer's userId to send notification
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findById(logData.trainerId);
        if (trainer && trainer.userId) {
          const trainerUserId = trainer.userId._id ? trainer.userId._id.toString() : trainer.userId.toString();
          
          // Get client name for notification
          const clientName = client.userId?.name || client.userId?.email || 'Client';
          
          io.to(trainerUserId).emit("client:workout_status_changed", {
            clientId: client._id,
            clientName: clientName,
            date,
            status,
            reason,
            logId: result.log._id,
            photo: result.log.photo,
          });
        }
      } catch (trainerError) {
        console.error('Error getting trainer for notification:', trainerError);
      }
    }

    return sendSuccess(res, result.log, {}, 201);
  } catch (error) {
    console.error('Error in workout log create:', error);
    console.error('Error stack:', error.stack);
    return sendError(res, error, 500);
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
      return sendError(res, "Workout log not found", 404);
    }

    // Emit Socket.IO event to notify trainer about workout status change
    const io = req.app.get("io");
    if (io && log.trainerId) {
      // Get trainer's userId to send notification
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findById(log.trainerId);
        if (trainer && trainer.userId) {
          const trainerUserId = trainer.userId._id ? trainer.userId._id.toString() : trainer.userId.toString();
          
          // Get client info for notification
          const Clients = require("../../../../data/clients");
          const client = await Clients.ClientService.findById(log.clientId);
          const clientName = client?.userId?.name || client?.userId?.email || 'Client';
          
          io.to(trainerUserId).emit("client:workout_status_changed", {
            clientId: log.clientId,
            clientName: clientName,
            date: log.date,
            status: updateData.status,
            reason: updateData.reason,
            logId: log._id,
            photo: log.photo,
          });
        }
      } catch (trainerError) {
        console.error('Error getting trainer for notification:', trainerError);
      }
    }

    return sendSuccess(res, log);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function list(req, res) {
  try {
    const { limit = 20, skip = 0, clientId, trainerId, workoutPlanId, from, to } = req.query;
    const result = await service.findLogs(
      { clientId, trainerId, workoutPlanId, from, to },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    return sendSuccess(res, result.logs, {
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function stats(req, res) {
  try {
    const { clientId, period = "week" } = req.query;
    const stats = await service.statsByPeriod({ clientId, period });

    return sendSuccess(res, stats);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

module.exports = {
  list,
  create,
  update,
  stats,
};
