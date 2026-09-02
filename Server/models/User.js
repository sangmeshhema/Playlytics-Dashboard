const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true
  },

  password: {
    type: String,
    required: true
  },



  // ================= STEAM =================

  steamId: {
    type: String,
    default: ""
  },

  steamName: {
    type: String,
    default: ""
  },

  steamAvatar: {
    type: String,
    default: ""
  },



  // ================= YOUTUBE =================

  youtubeChannelId: {
    type: String,
    default: ""
  },

  youtubeChannelName: {
    type: String,
    default: ""
  },

  youtubeTokens: {
  type: Object,
  default: null
}

});

module.exports = mongoose.model(
  "User",
  UserSchema
);