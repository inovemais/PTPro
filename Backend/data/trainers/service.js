function TrainerService(TrainerModel) {
  const service = {
    create,
    update,
    findById,
    findAll,
    removeById,
  };

  function create(trainer) {
    const model = new TrainerModel(trainer);
    return save(model);
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) {
          return reject(err);
        }

        resolve({
          message: "Trainer created",
          trainer: model,
        });
      });
    });
  }

  function update(id, data) {
    return new Promise(function (resolve, reject) {
      TrainerModel.findByIdAndUpdate(id, data, { new: true }, function (err, updated) {
        if (err) return reject(err);
        resolve(updated);
      });
    });
  }

  function findById(id) {
    return new Promise(function (resolve, reject) {
      TrainerModel.findById(id)
        .populate("userId")
        .exec(function (err, trainer) {
          if (err) return reject(err);
          resolve(trainer);
        });
    });
  }

  function findAll(query, pagination) {
    const { search, sort, onlyValidated } = query;
    const { limit, skip } = pagination;

    const criteria = {};

    if (onlyValidated) {
      criteria.isValidated = true;
    }

    if (search) {
      criteria.$or = [
        { specialties: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
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
      TrainerModel.find(criteria)
        .populate("userId")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(async function (err, trainers) {
          if (err) return reject(err);

          const total = await TrainerModel.countDocuments(criteria);
          resolve({
            trainers,
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
      TrainerModel.findByIdAndRemove(id, function (err) {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }

  return service;
}

module.exports = TrainerService;


