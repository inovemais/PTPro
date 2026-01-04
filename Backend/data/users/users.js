let mongoose = require("mongoose");
let scopes = require("./scopes");

let Schema = mongoose.Schema;

let RoleSchema = new Schema({
  name: { type: String, required: true },
  scope: [
    {
      type: String,
      enum: [
        scopes.Admin,
        scopes.PersonalTrainer,
        scopes.Client,
      ],
    },
  ],
});

// create a schema
let UserSchema = new Schema({
  name: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  password: { type: String, required: true },
  role: { type: RoleSchema },
  age: { type: Number },
  address: { type: String },
  country: { type: String },
  taxNumber: { type: Number, unique: true, sparse: true },
});

// the schema is useless so far
// we need to create a model using it
let User = mongoose.model("User", UserSchema);

// make this available to our users in our Node applications
module.exports = User;
