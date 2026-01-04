const service = require("./service");
const Clients = require("../../../../data/clients");
const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");

async function create(req, res) {
  try {
    const userId = req.decoded?.id;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }

    // Get client profile for this user
    const client = await Clients.ClientService.findByUserId(userId);
    if (!client) {
      return sendError(res, "Client profile not found", 404);
    }

    const { requestedTrainerId, reason } = req.body;

    if (!requestedTrainerId) {
      return sendValidationError(res, "requestedTrainerId is required");
    }

    // Verify requested trainer exists
    const Trainers = require("../../../../data/trainers");
    try {
      const trainer = await Trainers.TrainerService.findById(requestedTrainerId);
      if (!trainer) {
        return sendValidationError(res, "Requested trainer not found");
      }
    } catch (err) {
      return sendValidationError(res, "Requested trainer not found");
    }

    // Check if there's already a pending request
    const existing = await service.findPendingByClient(client._id);
    if (existing) {
      return sendValidationError(res, "You already have a pending change request");
    }

    const request = await service.create({
      clientId: client._id,
      currentTrainerId: client.trainerId,
      requestedTrainerId,
      reason,
      status: "pending",
    });

    return sendSuccess(res, request, {}, 201);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function list(req, res) {
  try {
    const { status, limit = 10, skip = 0 } = req.query;
    const result = await service.findAll(
      { status },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    return sendSuccess(res, result.requests, {
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function approve(req, res) {
  try {
    const { id } = req.params;

    const request = await service.findById(id);
    if (!request) {
      return sendError(res, "Change request not found", 404);
    }

    if (request.status !== "pending") {
      return sendValidationError(res, "Request is not pending");
    }

    // Update request status
    const updated = await service.updateStatus(id, "approved");

    // Update client's trainer
    const clientId = request.clientId?._id || request.clientId;
    await Clients.ClientService.update(clientId, {
      trainerId: request.requestedTrainerId?._id || request.requestedTrainerId,
    });

    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function reject(req, res) {
  try {
    const { id } = req.params;

    const request = await service.findById(id);
    if (!request) {
      return sendError(res, "Change request not found", 404);
    }

    if (request.status !== "pending") {
      return sendValidationError(res, "Request is not pending");
    }

    const updated = await service.updateStatus(id, "rejected");
    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

module.exports = {
  create,
  list,
  approve,
  reject,
};

