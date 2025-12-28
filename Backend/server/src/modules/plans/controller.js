const service = require("./service");
const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");

async function list(req, res) {
  try {
    const { limit = 10, skip = 0, clientId, trainerId, isActive } = req.query;
    const result = await service.findPlans(
      { clientId, trainerId, isActive },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    sendSuccess(res, result.plans, {
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const plan = await service.findPlanById(id);

    if (!plan) {
      return sendError(res, "Plan not found", 404);
    }

    sendSuccess(res, plan);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function create(req, res) {
  try {
    const planData = req.body;

    // Validation
    if (!planData.trainerId || !planData.clientId || !planData.name) {
      return sendValidationError(res, "trainerId, clientId, and name are required");
    }

    if (![3, 4, 5].includes(planData.frequencyPerWeek)) {
      return sendValidationError(res, "frequencyPerWeek must be 3, 4, or 5");
    }

    // Validate sessions: max 10 exercises per session
    if (planData.sessions) {
      for (const session of planData.sessions) {
        if (session.exercises && session.exercises.length > 10) {
          return sendValidationError(
            res,
            `Session ${session.weekday} has more than 10 exercises (max allowed)`
          );
        }
      }
    }

    const plan = await service.createPlan(planData);
    sendSuccess(res, plan.plan, {}, 201);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate frequency if provided
    if (updateData.frequencyPerWeek && ![3, 4, 5].includes(updateData.frequencyPerWeek)) {
      return sendValidationError(res, "frequencyPerWeek must be 3, 4, or 5");
    }

    // Validate sessions: max 10 exercises per session
    if (updateData.sessions) {
      for (const session of updateData.sessions) {
        if (session.exercises && session.exercises.length > 10) {
          return sendValidationError(
            res,
            `Session ${session.weekday} has more than 10 exercises (max allowed)`
          );
        }
      }
    }

    const existing = await service.findPlanById(id);
    if (!existing) {
      return sendError(res, "Plan not found", 404);
    }

    const plan = await service.updatePlan(id, updateData);
    sendSuccess(res, plan);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    const plan = await service.findPlanById(id);
    if (!plan) {
      return sendError(res, "Plan not found", 404);
    }

    await service.removePlanById(id);
    sendSuccess(res, { message: "Plan deleted successfully" });
  } catch (error) {
    sendError(res, error, 500);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};

