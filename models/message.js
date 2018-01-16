var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
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
  },
  isImageMessage: {
    type: Boolean,
    required:true
  },
  fromUser:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
  toUser:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  }
});


var Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
