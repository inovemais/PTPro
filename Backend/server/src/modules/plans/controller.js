const service = require("./service");
const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");

async function list(req, res) {
  try {
    const { limit = 10, skip = 0, clientId, trainerId, isActive, weekday, sort, search } = req.query;
    const result = await service.findPlans(
      { clientId, trainerId, isActive, weekday, sort, search },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    return sendSuccess(res, result.plans, {
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const plan = await service.findPlanById(id);

    if (!plan) {
      return sendError(res, "Plan not found", 404);
    }

    return sendSuccess(res, plan);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function create(req, res) {
  try {
    const planData = req.body;
    const decoded = req.decoded || {};
    
    // Parse role from JWT token - role is an array like ["PersonalTrainer"]
    const userScopes = Array.isArray(decoded.role)
      ? decoded.role
      : decoded.role
      ? [decoded.role]
      : [];

    // If trainer (not admin) is creating, automatically assign their trainerId
    const isTrainer = userScopes.includes("PersonalTrainer") && !userScopes.includes("admin");
    
    if (isTrainer && !planData.trainerId) {
      // Find trainer profile for the logged in user
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findByUserId(decoded.id);
        if (trainer) {
          planData.trainerId = trainer._id;
        } else {
          console.error('Trainer profile not found for user:', decoded.id);
          return sendValidationError(res, "Trainer profile not found for logged in user");
        }
      } catch (err) {
        console.error('Error finding trainer:', err);
        return sendValidationError(res, "Error finding trainer profile");
      }
    }

    // Validation
    if (!planData.trainerId || !planData.clientId || !planData.name) {
      return sendValidationError(res, "trainerId, clientId, and name are required");
    }

    if (![3, 4, 5].includes(planData.frequencyPerWeek)) {
      return sendValidationError(res, "frequencyPerWeek must be 3, 4, or 5");
    }

    // Validate workoutDates: must match frequencyPerWeek
    if (planData.workoutDates) {
      if (!Array.isArray(planData.workoutDates)) {
        return sendValidationError(res, "workoutDates must be an array");
      }
      if (planData.workoutDates.length !== planData.frequencyPerWeek) {
        return sendValidationError(
          res,
          `workoutDates must have exactly ${planData.frequencyPerWeek} dates (one for each workout per week), but got ${planData.workoutDates.length}`
        );
      }
      // Validate all dates are valid and convert to Date objects
      const validDates = [];
      for (let i = 0; i < planData.workoutDates.length; i++) {
        const date = new Date(planData.workoutDates[i]);
        if (isNaN(date.getTime())) {
          return sendValidationError(res, `workoutDates[${i}] is not a valid date: ${planData.workoutDates[i]}`);
        }
        validDates.push(date);
      }
      // Replace with validated Date objects
      planData.workoutDates = validDates;
    }
    
    // Ensure startDate is a Date object
    if (planData.startDate) {
      const startDate = new Date(planData.startDate);
      if (isNaN(startDate.getTime())) {
        return sendValidationError(res, `startDate is not a valid date: ${planData.startDate}`);
      }
      planData.startDate = startDate;
    }

    // Validate sessions: max 10 exercises per session and required fields
    if (planData.sessions) {
      if (!Array.isArray(planData.sessions)) {
        return sendValidationError(res, "sessions must be an array");
      }
      for (let i = 0; i < planData.sessions.length; i++) {
        const session = planData.sessions[i];
        if (!session.weekday) {
          return sendValidationError(res, `Session at index ${i} is missing weekday`);
        }
        if (!['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(session.weekday)) {
          return sendValidationError(res, `Session at index ${i} has invalid weekday: ${session.weekday}`);
        }
        if (session.exercises) {
          if (!Array.isArray(session.exercises)) {
            return sendValidationError(res, `Session ${session.weekday} exercises must be an array`);
          }
          if (session.exercises.length > 10) {
            return sendValidationError(
              res,
              `Session ${session.weekday} has more than 10 exercises (max allowed)`
            );
          }
          // Validate each exercise has required fields
          for (let j = 0; j < session.exercises.length; j++) {
            const exercise = session.exercises[j];
            if (!exercise.name || exercise.name.trim() === '') {
              return sendValidationError(res, `Session ${session.weekday}, exercise ${j + 1} is missing name`);
            }
            if (!exercise.sets || exercise.sets <= 0) {
              return sendValidationError(res, `Session ${session.weekday}, exercise ${j + 1} (${exercise.name}) has invalid sets`);
            }
            if (!exercise.reps || exercise.reps <= 0) {
              return sendValidationError(res, `Session ${session.weekday}, exercise ${j + 1} (${exercise.name}) has invalid reps`);
            }
          }
        }
      }
    }

    const plan = await service.createPlan(planData);
    return sendSuccess(res, plan.plan, {}, 201);
  } catch (error) {
    console.error('Error creating plan:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return sendError(res, error, 500);
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

    // Validate workoutDates if provided
    if (updateData.workoutDates !== undefined) {
      if (!Array.isArray(updateData.workoutDates)) {
        return sendValidationError(res, "workoutDates must be an array");
      }
      const frequency = updateData.frequencyPerWeek || (await service.findPlanById(id)).frequencyPerWeek;
      if (updateData.workoutDates.length !== frequency) {
        return sendValidationError(
          res,
          `workoutDates must have exactly ${frequency} dates (one for each workout per week)`
        );
      }
      // Validate all dates are valid
      for (let i = 0; i < updateData.workoutDates.length; i++) {
        const date = new Date(updateData.workoutDates[i]);
        if (isNaN(date.getTime())) {
          return sendValidationError(res, `workoutDates[${i}] is not a valid date`);
        }
      }
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
    return sendSuccess(res, plan);
  } catch (error) {
    return sendError(res, error, 500);
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
    return sendSuccess(res, { message: "Plan deleted successfully" });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};

