var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  toUserId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  fromBUserId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  sentDatetime: {
    type: Date,
    required: true
  },
  chatId: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  }
});


var Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
