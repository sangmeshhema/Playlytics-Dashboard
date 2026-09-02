const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  userId: String,
  game: String,
  hours: Number,
  wins: Number
});

module.exports = mongoose.model("Game", GameSchema);