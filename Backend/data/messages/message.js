let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Mensagem de chat entre cliente e personal trainer
let MessageSchema = new Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

let Message = mongoose.model("Message", MessageSchema);

module.exports = Message;


