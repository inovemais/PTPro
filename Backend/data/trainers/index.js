let Trainer = require("./trainer");
let TrainerService = require("./service");

module.exports = {
  Trainer,
  TrainerService: TrainerService(Trainer),
};


