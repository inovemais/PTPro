let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Registo diário de cumprimento de treino
let WorkoutLogSchema = new Schema(
  {
    workoutPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkoutPlan", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["completed", "missed", "partial"],
      required: true,
    },
    reason: { type: String }, // motivo se falhou
    photo: { type: String }, // caminho para imagem enviada
  },
  { timestamps: true }
);

let WorkoutLog = mongoose.model("WorkoutLog", WorkoutLogSchema);

module.exports = WorkoutLog;


