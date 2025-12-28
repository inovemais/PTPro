function TrainerChangeRequestService(TrainerChangeRequestModel) {
  const service = {
    create,
    updateStatus,
    findAll,
    findById,
  };

  function create(request) {
    const model = new TrainerChangeRequestModel(request);
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) return reject(err);
        resolve(model);
      });
    });
  }

  function updateStatus(id, status) {
    return new Promise(function (resolve, reject) {
      TrainerChangeRequestModel.findByIdAndUpdate(
        id,
        { status },
        { new: true },
        function (err, updated) {
          if (err) return reject(err);
          resolve(updated);
        }
      );
    });
  }

  function findAll(query, pagination) {
    const { status } = query;
    const { limit, skip } = pagination;

    const criteria = {};
    if (status) criteria.status = status;

    return new Promise(function (resolve, reject) {
      TrainerChangeRequestModel.find(criteria)
        .populate("clientId")
        .populate("currentTrainerId")
        .populate("requestedTrainerId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(async function (err, requests) {
          if (err) return reject(err);

          const total = await TrainerChangeRequestModel.countDocuments(criteria);
          resolve({
            requests,
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

  function findById(id) {
    return new Promise(function (resolve, reject) {
      TrainerChangeRequestModel.findById(id)
        .populate("clientId")
        .populate("currentTrainerId")
        .populate("requestedTrainerId")
        .exec(function (err, request) {
          if (err) return reject(err);
          resolve(request);
        });
    });
  }

  return service;
}

module.exports = TrainerChangeRequestService;


