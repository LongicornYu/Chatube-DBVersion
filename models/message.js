var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  toUserId: {
    type: String,
    unique: false,
    required: true,
    trim: true
  },
  fromUserId: {
    type: String,
    unique: false,
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
