let TrainerChangeRequest = require("./trainerChangeRequest");
let TrainerChangeRequestService = require("./service");

module.exports = {
  TrainerChangeRequest,
  TrainerChangeRequestService: TrainerChangeRequestService(TrainerChangeRequest),
};


