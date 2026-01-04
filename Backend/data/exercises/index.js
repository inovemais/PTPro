let Exercise = require("./exercise");
let ExerciseService = require("./service");

module.exports = {
  Exercise,
  ExerciseService: ExerciseService(Exercise),
};

