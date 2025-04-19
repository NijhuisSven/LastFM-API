const mongoose = require('mongoose');

const AuthCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d'
  }
});

module.exports = mongoose.model('LastfmAuthCode', AuthCodeSchema);