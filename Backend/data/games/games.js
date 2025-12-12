let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// create a schema
let GameSchema = new Schema({
  date: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  stadiumId: { type: mongoose.Schema.Types.ObjectId, ref: "Stadium", required: true },
  team: {
    visitor: { type: String, required: true },
    home: { type: String, required: true },
  },
});

// the schema is useless so far
// we need to create a model using it
let Game = mongoose.model("Game", GameSchema);

// make this available to our users in our Node applications
module.exports = Game;
