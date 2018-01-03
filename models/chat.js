var mongoose = require('mongoose');

var ChatSchema = new mongoose.Schema({
  chatAUserId: {
    type: String,
    unique: false,
    required: true,
    trim: true
  },
  chatBUserId: {
    type: String,
    unique: false,
    required: true,
    trim: true
  }
});



var Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;
