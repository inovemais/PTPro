let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Perfil de Personal Trainer
let TrainerSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    bio: { type: String },
    specialties: [{ type: String }],
    phone: { type: String },
    photo: { type: String }, // caminho para upload de imagem
    isValidated: { type: Boolean, default: false }, // validado por admin
    isActive: { type: Boolean, default: true }, // ativo/inativo
  },
  { timestamps: true }
);

let Trainer = mongoose.model("Trainer", TrainerSchema);

module.exports = Trainer;


