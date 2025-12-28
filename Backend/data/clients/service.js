function ClientService(ClientModel) {
  const service = {
    create,
    update,
    findById,
    findAll,
    findByUserId,
    removeById,
  };

  function create(client) {
    const model = new ClientModel(client);
    return save(model);
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) {
          return reject(err);
        }

        resolve({
          message: "Client created",
          client: model,
        });
      });
    });
  }

  function update(id, data) {
    return new Promise(function (resolve, reject) {
      ClientModel.findByIdAndUpdate(id, data, { new: true }, function (err, updated) {
        if (err) return reject(err);
        resolve(updated);
      });
    });
  }

  function findById(id) {
    return new Promise(function (resolve, reject) {
      ClientModel.findById(id)
        .populate("userId")
        .populate("trainerId")
        .exec(function (err, client) {
          if (err) return reject(err);
          resolve(client);
        });
    });
  }

  function findByUserId(userId) {
    return new Promise(function (resolve, reject) {
      ClientModel.findOne({ userId })
        .populate("userId")
        .populate("trainerId")
        .exec(function (err, client) {
          if (err) return reject(err);
          resolve(client);
        });
    });
  }

  function findAll(query, pagination) {
    const { search, sort, trainerId } = query;
    const { limit, skip } = pagination;

    const criteria = {};

    if (trainerId) {
      criteria.trainerId = trainerId;
    }

    if (search) {
      criteria.$or = [
        { goal: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
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
      ClientModel.find(criteria)
        .populate("userId")
        .populate("trainerId")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(async function (err, clients) {
          if (err) return reject(err);

          const total = await ClientModel.countDocuments(criteria);
          resolve({
            clients,
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

  function removeById(id) {
    return new Promise(function (resolve, reject) {
      ClientModel.findByIdAndRemove(id, function (err) {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }

  return service;
}

module.exports = ClientService;


