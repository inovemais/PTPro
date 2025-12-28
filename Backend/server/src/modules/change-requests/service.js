const TrainerChangeRequests = require("../../../../data/trainerChangeRequests");
const TrainerChangeRequest = TrainerChangeRequests.TrainerChangeRequest;

const service = TrainerChangeRequests.TrainerChangeRequestService;

// Add custom method
service.findPendingByClient = function (clientId) {
  return new Promise((resolve, reject) => {
    TrainerChangeRequest.findOne({ clientId, status: "pending" })
      .populate("clientId")
      .populate("currentTrainerId")
      .populate("requestedTrainerId")
      .exec((err, request) => {
        if (err) return reject(err);
        resolve(request);
      });
  });
};

module.exports = service;

