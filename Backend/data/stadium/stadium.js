let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let sections = require('./sections');

let SectorSchema = new Schema({
    price: { type: Number, required: true },
    priceMember: { type: Number, required: true },
    sector: [
      {
        type: String,
        enum: [sections.GrandStand, sections.Tribune, sections.Sides, sections.Bench],
      },
    ],
  });

// create a schema
let StadiumSchema = new Schema({
  name: { type: String, required: true, unique: true  },
  photo: { type: String},
  sectors: [{ type: SectorSchema }]
});

// the schema is useless so far
// we need to create a model using it
let Stadium = mongoose.model("Stadium", StadiumSchema);

// make this available to our users in our Node applications
module.exports = Stadium;