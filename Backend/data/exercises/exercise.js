let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Exercício da biblioteca
let ExerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    muscleGroup: { type: String },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    instructions: { type: String },
    videoUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin ou Trainer que criou
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Índice para busca por nome
ExerciseSchema.index({ name: "text", description: "text" });

let Exercise = mongoose.model("Exercise", ExerciseSchema);

module.exports = Exercise;

