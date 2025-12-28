const service = require("./service");
const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");

async function list(req, res) {
  try {
    const { limit = 10, skip = 0, search, trainerId } = req.query;
    const decoded = req.decoded || {};
    const userScopes = Array.isArray(decoded.role?.scope)
      ? decoded.role.scope
      : decoded.role?.scope
      ? [decoded.role.scope]
      : [];

    // If trainer (not admin), only show their clients
    const isTrainer = userScopes.includes("PersonalTrainer") && !userScopes.includes("admin");
    const filterTrainerId = isTrainer ? decoded.id : trainerId;

    const result = await service.findAll(
      { search, trainerId: filterTrainerId },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    sendSuccess(res, result.clients, {
      pagination: result.pagination,
    });
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function getMe(req, res) {
  try {
    const userId = req.decoded?.id;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }

    const client = await service.findByUserId(userId);
    if (!client) {
      return sendError(res, "Client profile not found", 404);
    }

    sendSuccess(res, client);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function updateMe(req, res) {
  try {
    const userId = req.decoded?.id;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }

    const client = await service.findByUserId(userId);
    if (!client) {
      return sendError(res, "Client profile not found", 404);
    }

    const updated = await service.update(client._id, req.body);
    sendSuccess(res, updated);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const client = await service.findById(id);

    if (!client) {
      return sendError(res, "Client not found", 404);
    }

    sendSuccess(res, client);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function create(req, res) {
  try {
    const clientData = req.body;
    const decoded = req.decoded || {};
    const userScopes = Array.isArray(decoded.role?.scope)
      ? decoded.role.scope
      : decoded.role?.scope
      ? [decoded.role.scope]
      : [];

    if (!clientData.userId) {
      return sendValidationError(res, "userId is required");
    }

    // If trainer (not admin) is creating, automatically assign their trainerId
    const isTrainer = userScopes.includes("PersonalTrainer") && !userScopes.includes("admin");
    if (isTrainer && !clientData.trainerId) {
      // Find trainer profile for the logged in user
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findByUserId(decoded.id);
        if (trainer) {
          clientData.trainerId = trainer._id;
        } else {
          return sendValidationError(res, "Trainer profile not found for logged in user");
        }
      } catch (err) {
        return sendValidationError(res, "Error finding trainer profile");
      }
    }

    // Ensure client is associated with only one trainer
    if (clientData.trainerId) {
      // Verify trainer exists
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findById(clientData.trainerId);
        if (!trainer) {
          return sendValidationError(res, "Trainer not found");
        }
      } catch (err) {
        return sendValidationError(res, "Trainer not found");
      }
    }

    const client = await service.create(clientData);
    sendSuccess(res, client.client, {}, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendValidationError(res, "Client profile already exists for this user");
    }
    sendError(res, error, 500);
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If updating trainerId, verify trainer exists
    if (updateData.trainerId) {
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findById(updateData.trainerId);
        if (!trainer) {
          return sendValidationError(res, "Trainer not found");
        }
      } catch (err) {
        return sendValidationError(res, "Trainer not found");
      }
    }

    const existing = await service.findById(id);
    if (!existing) {
      return sendError(res, "Client not found", 404);
    }

    const client = await service.update(id, updateData);
    sendSuccess(res, client);
  } catch (error) {
    sendError(res, error, 500);
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    const client = await service.findById(id);
    if (!client) {
      return sendError(res, "Client not found", 404);
    }

    await service.removeById(id);
    sendSuccess(res, { message: "Client deleted successfully" });
  } catch (error) {
    sendError(res, error, 500);
  }
}

module.exports = {
  list,
  getMe,
  updateMe,
  getById,
  create,
  update,
  remove,
};

