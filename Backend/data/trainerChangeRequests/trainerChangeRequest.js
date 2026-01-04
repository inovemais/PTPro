let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Pedido de alteração de Personal Trainer, aprovado por admin
let TrainerChangeRequestSchema = new Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    currentTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer" },
    requestedTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

let TrainerChangeRequest = mongoose.model("TrainerChangeRequest", TrainerChangeRequestSchema);

module.exports = TrainerChangeRequest;


