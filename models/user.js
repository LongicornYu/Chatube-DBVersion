var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  passwordConf: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  friends: [{
    id : String,
    username : String
  }],
  online:{
    type: Boolean
  }
});

//authenticate input against database
UserSchema.statics.authenticate = function (email, password, callback) {
  User.findOne({ email: email })
    .exec(function (err, user) {
      if (err) {
        return callback(err)
      } else if (!user) {
        var err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }

      if (password === user.password) {
          return callback(null, user);
        } else {
          return callback();
        }

      /*
      bcrypt.compare(password, user.password, function (err, result) {
        if (result === true) {
          return callback(null, user);
        } else {
          return callback();
        }
      })
      */
    });
}

UserSchema.statics.findUserByEmail = function (email, callback) {
  User.findOne({ email: email })
    .exec(function (err, user) {
      if (err) {
        return callback(err, null)
      }
      else {
        return callback(null, user);
      }
    });
}


//hashing a password before saving it to the database
UserSchema.pre('save', function (next) {

/*  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }
    console.log('hash:' + hash);
    user.password = hash;
    next();
  })
  */
  next();
});


var User = mongoose.model('User', UserSchema);
module.exports = User;
