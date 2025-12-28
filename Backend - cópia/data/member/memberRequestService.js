function MemberRequestService(MemberRequestModel) {
  let service = {
    create,
    findAll,
    findByUserId,
    findById,
    update,
    findByStatus,
  };

  function create(request) {
    let newRequest = MemberRequestModel(request);
    return save(newRequest);
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      model.save(function (err) {
        if (err) reject("There is a problema with register");

        resolve({
          message: "Member request saved",
          request: model,
        });
      });
    });
  }

  function findAll(pagination) {
    return new Promise(function (resolve, reject) {
      const limit = pagination && pagination.limit ? pagination.limit : 10;
      const skip = pagination && pagination.skip ? pagination.skip : 0;

      MemberRequestModel.find()
        .populate('userId', 'name email')
        .populate('adminId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ requestDate: -1 })
        .exec(function (err, requests) {
          if (err) reject(err);
          resolve(requests);
        });
    });
  }

  function findByUserId(userId) {
    return new Promise(function (resolve, reject) {
      MemberRequestModel.find({ userId })
        .sort({ requestDate: -1 })
        .exec(function (err, requests) {
          if (err) reject(err);
          resolve(requests);
        });
    });
  }

  function findById(id) {
    return new Promise(function (resolve, reject) {
      MemberRequestModel.findById(id)
        .populate('userId', 'name email')
        .populate('adminId', 'name')
        .exec(function (err, request) {
          if (err) reject(err);
          resolve(request);
        });
    });
  }

  function findByStatus(status) {
    return new Promise(function (resolve, reject) {
      MemberRequestModel.find({ status })
        .populate('userId', 'name email')
        .populate('adminId', 'name')
        .sort({ requestDate: -1 })
        .exec(function (err, requests) {
          if (err) reject(err);
          resolve(requests);
        });
    });
  }

  function update(id, updateData) {
    return new Promise(function (resolve, reject) {
      updateData.responseDate = new Date();
      MemberRequestModel.findByIdAndUpdate(id, updateData, { new: true }, function (err, requestUpdated) {
        if (err) reject('Dont updated MemberRequest');
        resolve(requestUpdated);
      });
    });
  }

  return service;
}

module.exports = MemberRequestService;

