let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// create a schema
let MemberRequestSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending',
    required: true 
  },
  requestDate: { type: Date, default: Date.now },
  responseDate: { type: Date },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin que aprovou/rejeitou
  reason: { type: String }, // Motivo da rejeição (opcional)
});

// the schema is useless so far
// we need to create a model using it
let MemberRequest = mongoose.model("MemberRequest", MemberRequestSchema);

// make this available to our users in our Node applications
module.exports = MemberRequest;

