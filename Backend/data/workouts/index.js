let WorkoutLog = require("./workoutLog");
let workoutPlanModule = require("./workoutPlan");
let WorkoutPlan = workoutPlanModule.WorkoutPlan;
let WorkoutService = require("./service");

module.exports = {
  WorkoutPlan,
  WorkoutLog,
  ExerciseSchema: workoutPlanModule.ExerciseSchema,
  WorkoutSessionSchema: workoutPlanModule.WorkoutSessionSchema,
  WorkoutService: WorkoutService(),
};


