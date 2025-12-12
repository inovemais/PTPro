let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// create a schema
let MemberSchema = new Schema({
  dataCreated: { type: String },
  paymentRegular: { type: Boolean },
  cash: { type: Number },
  taxNumber: { type: Number },
  photo: { type: String },
});

// the schema is useless so far
// we need to create a model using it
let Member = mongoose.model("Member", MemberSchema);

// make this available to our users in our Node applications
module.exports = Member;