const service = require("./service");
const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");

/**
 * List all trainers (with filters)
 */
async function list(req, res) {
  try {
    const { limit = 10, skip = 0, search, onlyValidated } = req.query;
    const result = await service.findAll(
      { search, onlyValidated: onlyValidated === "true" },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    sendSuccess(res, result.trainers, {
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}

/**
 * List public trainers (validated only)
 */
async function listPublic(req, res) {
  try {
    const { limit = 10, skip = 0 } = req.query;
    const result = await service.findAll(
      { onlyValidated: true },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    sendSuccess(res, result.trainers, {
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}

/**
 * Get trainer by ID
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    const trainer = await service.findById(id);

    if (!trainer) {
      return sendError(res, "Trainer not found", 404);
    }

    sendSuccess(res, trainer);
  } catch (error) {
    sendError(res, error, 500);
  }
}

/**
 * Create new trainer profile
 */
async function create(req, res) {
  try {
    const trainerData = req.body;

    // Validation
    if (!trainerData.userId) {
      return sendValidationError(res, "userId is required");
    }

    const trainer = await service.create(trainerData);
    sendSuccess(res, trainer.trainer, {}, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendValidationError(res, "Trainer profile already exists for this user");
    }
    sendError(res, error, 500);
  }
}

/**
 * Update trainer profile
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if trainer exists
    const existing = await service.findById(id);
    if (!existing) {
      return sendError(res, "Trainer not found", 404);
    }

    const trainer = await service.update(id, updateData);
    sendSuccess(res, trainer);
  } catch (error) {
    sendError(res, error, 500);
  }
}

/**
 * Validate trainer (Admin only)
 */
async function validate(req, res) {
  try {
    const { id } = req.params;

    const trainer = await service.update(id, { isValidated: true });
    if (!trainer) {
      return sendError(res, "Trainer not found", 404);
    }

    sendSuccess(res, trainer);
  } catch (error) {
    sendError(res, error, 500);
  }
}

/**
 * Delete trainer
 */
async function remove(req, res) {
  try {
    const { id } = req.params;

    const trainer = await service.findById(id);
    if (!trainer) {
      return sendError(res, "Trainer not found", 404);
    }

    await service.removeById(id);
    sendSuccess(res, { message: "Trainer deleted successfully" });
  } catch (error) {
    sendError(res, error, 500);
  }
}

module.exports = {
  list,
  listPublic,
  getById,
  create,
  update,
  validate,
  remove,
};

