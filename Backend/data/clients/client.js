let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Perfil de Cliente, associado a um User e a um único Personal Trainer
let ClientSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer" }, // pode ser null até ser atribuído
    heightCm: { type: Number },
    weightKg: { type: Number },
    goal: { type: String }, // objetivo principal (perder peso, ganhar massa, etc.)
    notes: { type: String },
    isValidated: { type: Boolean, default: false }, // indica se o registo do cliente foi validado por admin/trainer
  },
  { timestamps: true }
);

let Client = mongoose.model("Client", ClientSchema);

module.exports = Client;


