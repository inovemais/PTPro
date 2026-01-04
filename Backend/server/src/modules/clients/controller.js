const service = require("./service");
const { sendSuccess, sendError, sendValidationError } = require("../../utils/response");

async function list(req, res) {
  try {
    const { limit = 10, skip = 0, search, trainerId } = req.query;
    const decoded = req.decoded || {};
    // Parse role from JWT token - role is an array like ["PersonalTrainer"]
    const userScopes = Array.isArray(decoded.role)
      ? decoded.role
      : decoded.role
      ? [decoded.role]
      : [];

    // If trainer (not admin), only show their clients
    const isTrainer = userScopes.includes("PersonalTrainer") && !userScopes.includes("admin");
    
    let filterTrainerId = trainerId;
    
    if (isTrainer) {
      // Get trainer profile to get the trainer._id (not user._id)
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findByUserId(decoded.id);
        if (trainer) {
          filterTrainerId = trainer._id;
        } else {
          // Trainer without profile can't see any clients
          return sendSuccess(res, [], {
            pagination: {
              pageSize: parseInt(limit),
              page: 1,
              hasMore: false,
              total: 0,
            },
          });
        }
      } catch (err) {
        console.error('Error finding trainer profile in list:', err);
        return sendError(res, "Error finding trainer profile", 500);
      }
    }

    const result = await service.findAll(
      { search, trainerId: filterTrainerId },
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    return sendSuccess(res, result.clients, {
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error, 500);
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

    return sendSuccess(res, client);
  } catch (error) {
    return sendError(res, error, 500);
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
    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const client = await service.findById(id);

    if (!client) {
      return sendError(res, "Client not found", 404);
    }

    return sendSuccess(res, client);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function create(req, res) {
  try {
    const clientData = req.body;
    const decoded = req.decoded || {};
    // Parse role from JWT token - role is an array like ["PersonalTrainer"]
    const userScopes = Array.isArray(decoded.role)
      ? decoded.role
      : decoded.role
      ? [decoded.role]
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
    return sendSuccess(res, client.client, {}, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendValidationError(res, "Client profile already exists for this user");
    }
    return sendError(res, error, 500);
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const decoded = req.decoded || {};
    
    // Parse role from JWT token
    const userScopes = Array.isArray(decoded.role)
      ? decoded.role
      : decoded.role
      ? [decoded.role]
      : [];
    const isAdmin = userScopes.includes("admin");

    const existing = await service.findById(id);
    if (!existing) {
      return sendError(res, "Client not found", 404);
    }

    // If updating trainerId, ensure client can only have one trainer
    if (updateData.trainerId !== undefined) {
      // Normalize empty string to null
      if (updateData.trainerId === '') {
        updateData.trainerId = null;
      }

      // If trainerId is null, allow removing trainer assignment (only admin can do this)
      if (updateData.trainerId === null) {
        if (!isAdmin) {
          return sendValidationError(
            res,
            "Only admin can remove trainer assignment."
          );
        }
        // Allow null to remove trainer assignment
      } else {
        // Verify trainer exists (only if trainerId is not null)
        const Trainers = require("../../../../data/trainers");
        try {
          const trainer = await Trainers.TrainerService.findById(updateData.trainerId);
          if (!trainer) {
            return sendValidationError(res, "Trainer not found");
          }
        } catch (err) {
          return sendValidationError(res, "Trainer not found");
        }

        // If client already has a trainer and it's different, only admin can change it
        if (existing.trainerId && existing.trainerId.toString() !== updateData.trainerId) {
          if (!isAdmin) {
            return sendValidationError(
              res,
              "Client already has a trainer assigned. Only admin can change trainer assignment."
            );
          }
        }
      }
    }

    const client = await service.update(id, updateData);
    return sendSuccess(res, client);
  } catch (error) {
    return sendError(res, error, 500);
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
    return sendSuccess(res, { message: "Client deleted successfully" });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function assignToMe(req, res) {
  try {
    const { id } = req.params;
    const decoded = req.decoded || {};
    
    // Parse role from JWT token
    const userScopes = Array.isArray(decoded.role)
      ? decoded.role
      : decoded.role
      ? [decoded.role]
      : [];

    // Only trainers can assign clients to themselves
    const isTrainer = userScopes.includes("PersonalTrainer") && !userScopes.includes("admin");
    if (!isTrainer) {
      return sendError(res, "Only trainers can assign clients", 403);
    }

    // Find trainer profile for the logged in user
    const Trainers = require("../../../../data/trainers");
    let trainer;
    try {
      trainer = await Trainers.TrainerService.findByUserId(decoded.id);
      if (!trainer) {
        return sendValidationError(res, "Trainer profile not found for logged in user");
      }
    } catch (err) {
      return sendValidationError(res, "Error finding trainer profile");
    }

    // Check if client exists
    const client = await service.findById(id);
    if (!client) {
      return sendError(res, "Client not found", 404);
    }

    // Assign client to trainer (service will validate that client doesn't have another trainer)
    const updated = await service.assignToTrainer(id, trainer._id);
    return sendSuccess(res, updated);
  } catch (error) {
    if (error.message && error.message.includes("already has a trainer")) {
      return sendValidationError(res, error.message);
    }
    return sendError(res, error, 500);
  }
}

async function findAvailableUsers(req, res) {
  try {
    const { search, limit = 50, skip = 0 } = req.query;
    const decoded = req.decoded || {};
    
    // Parse role from JWT token
    const userScopes = Array.isArray(decoded.role)
      ? decoded.role
      : decoded.role
      ? [decoded.role]
      : [];

    // Only trainers and admins can search for available users
    const isTrainer = userScopes.includes("PersonalTrainer") && !userScopes.includes("admin");
    const isAdmin = userScopes.includes("admin");
    
    if (!isTrainer && !isAdmin) {
      return sendError(res, "Unauthorized", 403);
    }

    const Users = require("../../../../data/users");
    const scopes = require("../../../../data/users/scopes");
    
    // Build query for users with client role
    const userQuery = {
      "role.scope": scopes.Client,
    };

    // Add search if provided
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Find all users with client role
    const User = Users.UserModel;
    const users = await User.find(userQuery)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select("_id name email firstName lastName")
      .exec();

    // Get all existing client profiles to check which users already have trainers
    const allClients = await service.findAll({}, { limit: 1000, skip: 0 });
    const clientsWithTrainers = allClients.clients.filter(
      (c) => c.trainerId !== null && c.trainerId !== undefined
    );
    const userIdsWithTrainers = new Set(
      clientsWithTrainers.map((c) => {
        const userId = typeof c.userId === 'object' && c.userId !== null 
          ? c.userId._id || c.userId 
          : c.userId;
        return userId ? userId.toString() : null;
      }).filter(Boolean)
    );

    // Filter users: only return those without a trainer assigned
    const availableUsers = users
      .filter((user) => !userIdsWithTrainers.has(user._id.toString()))
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }));

    return sendSuccess(res, availableUsers, {
      pagination: {
        pageSize: parseInt(limit),
        page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
        total: availableUsers.length,
      },
    });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function listPending(req, res) {
  try {
    const { limit = 10, skip = 0, search } = req.query;
    const decoded = req.decoded || {};
    
    // Parse role from JWT token
    const userScopes = Array.isArray(decoded.role)
      ? decoded.role
      : decoded.role
      ? [decoded.role]
      : [];

    // Only trainers and admins can see pending clients
    const isTrainer = userScopes.includes("PersonalTrainer") && !userScopes.includes("admin");
    const isAdmin = userScopes.includes("admin");
    
    if (!isTrainer && !isAdmin) {
      return sendError(res, "Unauthorized", 403);
    }

    // Build query for pending clients
    const query = { 
      isValidated: false,
      search: search || undefined,
    };
    
    // If trainer (not admin), only show their clients
    if (isTrainer) {
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findByUserId(decoded.id);
        if (trainer) {
          query.trainerId = trainer._id;
        } else {
          // Trainer without profile can't see any clients
          return sendSuccess(res, [], {
            pagination: {
              pageSize: parseInt(limit),
              page: 1,
              hasMore: false,
              total: 0,
            },
          });
        }
      } catch (err) {
        return sendError(res, "Error finding trainer profile", 500);
      }
    }
    
    const result = await service.findAll(
      query,
      { limit: parseInt(limit), skip: parseInt(skip) }
    );

    return sendSuccess(res, result.clients, {
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

async function validate(req, res) {
  try {
    const { id } = req.params;
    const decoded = req.decoded || {};
    
    // Parse role from JWT token
    const userScopes = Array.isArray(decoded.role)
      ? decoded.role
      : decoded.role
      ? [decoded.role]
      : [];

    // Only trainers and admins can validate clients
    const isTrainer = userScopes.includes("PersonalTrainer") && !userScopes.includes("admin");
    const isAdmin = userScopes.includes("admin");
    
    if (!isTrainer && !isAdmin) {
      return sendError(res, "Unauthorized", 403);
    }

    const client = await service.findById(id);
    if (!client) {
      return sendError(res, "Client not found", 404);
    }

    // If trainer (not admin), can only validate their own clients
    if (isTrainer) {
      const Trainers = require("../../../../data/trainers");
      try {
        const trainer = await Trainers.TrainerService.findByUserId(decoded.id);
        if (!trainer) {
          return sendError(res, "Trainer profile not found", 404);
        }
        // Check if client belongs to this trainer
        const clientTrainerId = client.trainerId ? 
          (client.trainerId._id ? client.trainerId._id.toString() : client.trainerId.toString()) : 
          null;
        if (!clientTrainerId || clientTrainerId !== trainer._id.toString()) {
          return sendError(res, "You can only validate your own clients", 403);
        }
      } catch (err) {
        return sendError(res, "Error finding trainer profile", 500);
      }
    }

    // Validate the client
    const updated = await service.update(id, { isValidated: true });
    return sendSuccess(res, updated);
  } catch (error) {
    return sendError(res, error, 500);
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
  assignToMe,
  findAvailableUsers,
  listPending,
  validate,
};

