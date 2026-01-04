let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Exercício dentro de uma sessão de treino
let ExerciseSchema = new Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number, required: true },
    restSeconds: { type: Number }, // Tempo de descanso em segundos
    instructions: { type: String },
    videoUrl: { type: String },
  },
  { _id: false }
);

// Sessão de treino (até 10 exercícios) associada a um dia da semana
let WorkoutSessionSchema = new Schema(
  {
    week: { type: Number, default: 1 }, // Número da semana (Semana 1, 2, 3, etc.)
    weekday: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      required: true,
    },
    order: { type: Number, default: 0 }, // ordem no plano
    exercises: {
      type: [ExerciseSchema],
      validate: {
        validator: function (v) {
          return !v || v.length <= 10;
        },
        message: "Workout session cannot have more than 10 exercises",
      },
    },
  },
  { _id: false }
);

// Plano de treino associado a um cliente e a um personal trainer
let WorkoutPlanSchema = new Schema(
  {
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    name: { type: String, required: true },
    description: { type: String },
    frequencyPerWeek: { type: Number, enum: [3, 4, 5], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    workoutDates: [{ type: Date }], // Datas específicas dos treinos da semana
    sessions: [WorkoutSessionSchema],
  },
  { timestamps: true }
);

let WorkoutPlan = mongoose.model("WorkoutPlan", WorkoutPlanSchema);

module.exports = {
  WorkoutPlan,
  WorkoutSessionSchema,
  ExerciseSchema,
};


