// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

var gravatar = require('gravatar');
var os = require('os');
var http = require('http');
var mongoose = require("mongoose");
var bodyParser = require("body-parser")
var User = require('../models/user');
var Chat = require('../models/chat');
var Message = require('../models/message');
var connectedClients=[];
var connectedSockets=[];
// Export a function, so that we can pass
// the app and io instances from the app.js file:


module.exports = function(app,io){
	app.set('view engine', 'ejs');
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: false }))

	app.get('/', function(req, res){

		// Render views/home.html
		res.render('home');
	});
	app.get('/login', function(req, res){

		// Render views/home.html
		res.render('login');
	});

	app.get('/register', function(req, res){

		// Render views/home.html
		res.render('register');
	});

	app.get('/term', function(req, res){

		// Render views/home.html
		res.render('term');
	});


	app.post('/register', function (req, res, next) {
	  // confirm that user typed same password twice
	  if (req.body.password !== req.body.passwordConf) {
	    var err = new Error('Passwords do not match.');
	    err.status = 400;
	    res.send("passwords dont match");
	    return next(err);
	  }

	  if (req.body.email &&
	    req.body.username &&
	    req.body.password &&
	    req.body.passwordConf) {

	    var userData = {
	      email: req.body.email,
	      username: req.body.username,
	      password: req.body.password,
	      passwordConf: req.body.passwordConf,
	      avatar: req.body.avatar,
		  online: true
	    }

	    User.create(userData, function (error, user) {
	      if (error) {
	        return next(error);
	      } else {
	        req.session.userId = user._id;
	        //return res.render('chat', {user:user, friend:null, chat:null, messages:null});
	        return res.redirect('/chat');
	      }
	    });

	  } else {
	    var err = new Error('All fields required.');
	    err.status = 400;
	    return next(err);
	  }
	})

	app.post('/login', function (req, res, next) {
	  if (req.body.logemail && req.body.logpassword) {
	    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
	      if (error || !user) {
	        var err = new Error('Wrong email or password.');
	        err.status = 401;
	        return next(err);
	      } else {
	        req.session.userId = user._id;
					user.online=true;
					user.save();
	        return res.redirect('/chat');
	        //return res.render('chat', {user:user, friend:null, chat:null, messages:null});
	      }
	    });
	  } else {
	    var err = new Error('All fields required.');
	    err.status = 400;
	    return next(err);
	  }
	})

	app.get('/videoChat', function(req, res){

		// Render views/videoChat.html
		res.render('videoChat');
	});

	app.get('/create', function(req,res){

		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));

		// Redirect to the random room
		res.redirect('/chat/'+id);
	});


	app.get('/chat/:id', function(req,res){
		User.findById(req.session.userId).exec(function (error, user) {

          User.find({'_id': {'$in' : user.friends.map(a => a.id)}}).exec(function(err, items) {

			User.findById(req.params.id).exec(function (error, friend)
			{
				Chat.findOne({
	        $or: [{
	            'chatAUserId': user._id,
							'chatBUserId': friend._id
	        }, {
	            'chatAUserId': friend._id,
							'chatBUserId': user._id
	        }]}).exec(function (err, chat) {
						if(chat)
						{
							Message.find({ chatId: chat._id }).populate('fromUser').sort('sentDatetime').exec(function (err, messages)
							{
									console.log(messages);
									res.render('chat', {user:user,friendlist:items, friend:friend, chat: chat, messages:messages});
							});
						}
						else {
							var chatData = {
					      chatAUserId: user._id,
					      chatBUserId: friend._id
					    }

					    Chat.create(chatData, function (error, chat) {
					      if (error) {
					        return next(error);
					      } else {
					        req.session.userId = user._id;
									req.session.chatId = chat._id;
									res.render('chat', {user:user, friendlist:items, friend:friend, chat: chat, messages:null});
					      }
					    });

						}
					});
			});
		});

	});
});

	app.get('/chat', function(req,res,next){
		User.findById(req.session.userId)
	    .exec(function (error, user) {
	      if (error) {
	        return next(error);
	      } else {
	        if (user === null) {
	          var err = new Error('Not authorized! Go back!');
	          err.status = 400;
	          return next(err);
	        } else {

	          User.find({'_id': {'$in' : user.friends.map(a => a.id)}}).exec(function(err, items) {
	          	 res.render('chat', {user: user, friendlist:items, friend: null, chat:null, messages:null});
	          });
	        }
	      }
	    });
	});

	app.get('/logout', function (req, res, next) {
	  if (req.session) {
	    // delete session object
		User.findById(req.session.userId)
			    .exec(function (error, user) {
			      if (error) {
			        return next(error);
			      } else {
			        if (user === null) {
			          var err = new Error('Not authorized! Go back!');
			          err.status = 400;
			          return next(err);
			        } else {
			          user.online= false;
			          user.save();
			        }
			      }
			    });



	    req.session.destroy(function (err) {
	      if (err) {
	        return next(err);
	      } else {
	        return res.redirect('/');
	      }
	    });
	  }
	});

	// Initialize a new socket.io application, named 'chat'
	var chat = io.on('connection', function (socket) {

		// When the client emits the 'load' event, reply with the
		// number of people in this chat room

		socket.on('load',function(data){

			var room = findClientsSocket(io,data);

			socket.emit('peopleinchat', {number: room.length});

		});

		socket.on('addFriend',function(data){
			console.log('addFriend!');
			if (data.friendEmail) {
				//Check if friend already added
				User.findUserByEmail(data.friendEmail, function (error, friend) {
					if (error || !friend) {
					    var err = new Error('User doesnt exist.');
					    err.status = 401;
					    socket.emit('showError', {err: 'User doesnt exist.'});
			        } else {
								User.findById(data.userId).exec(function (error, user) {
									if (error) {
							    	return next(error);
									} else {
							    	if (user === null) {
							    		var err = new Error('Not authorized! Go back!');
							        err.status = 400;
							        socket.emit('showError', {err: 'Not authorized! Go back!'});
							    	} else {
							    		if (friend._id.toString() === user._id.toString())
							    		{
							    				var err = new Error('Cannot add yourself as friend');
								        	err.status = 400;
								        	socket.emit('showError', {err: 'Cannot add yourself as friend'});
							    		}
							    		else
							    		{
													var fnd1 = {username: friend.username , id:friend._id};
													var fnd_id_1 = user.friends.map(a => a.id);
													console.log(fnd_id_1.indexOf(friend._id.toString()));
													if(fnd_id_1.indexOf(friend._id.toString()) === -1) {
														user.friends.push(fnd1);
														user.save();
													}
													else
													{
														console.log('a7');
														var err = new Error('User already in your friend list');
											        	err.status = 400;
											        	socket.emit('showError', {err: 'User already in your friend list'});
													}

													var fnd2 = {username: user.username , id:user._id};
													var fnd_id_2 = friend.friends.map(a => a.id);
													console.log(fnd_id_2.indexOf(user._id.toString()))
													if(fnd_id_2.indexOf(user._id.toString()) === -1) {
														friend.friends.push(fnd2);
														friend.save();
														socket.emit('updateProfilFriendListAdd', {friendId:friend._id.toString(), friendUsername:friend.username});
														socket.emit('showSuccessMessage', {message:'Friend added successfully'});
													}
								    }
						      }
					      }
				    	});
			      	}
				});

			} else {
				var err = new Error('All fields required.');
				err.status = 400;
				socket.emit('showError', {err: err});
			}
		});


		socket.on('deleteFriend',function(data){
			User.findById(data.userId).exec(function (error, user) {
				if (error) {
					return next(error);
				} else {
					if (user === null) {
						var err = new Error('Not authorized! Go back!');
						err.status = 400;
						socket.emit('showError', {err: 'Not authorized! Go back!'});
					} else {
						User.findById(data.friendId).exec(function (error, friend) {
							if (error) {
								return next(error);
							} else {
								if (friend === null) {
									var err = new Error('Not authorized! Go back!');
									err.status = 400;
									socket.emit('showError', {err: 'Not authorized! Go back!'});
								} else {
									var fnd_id_1 = user.friends.map(a => a.id);
									var index = fnd_id_1.indexOf(friend._id.toString());
									user.friends.splice(index, 1);
									user.save();

									var fnd_id_2 = friend.friends.map(a => a.id);
								  index = fnd_id_2.indexOf(user._id.toString());
									friend.friends.splice(index, 1);
									friend.save();
									socket.emit('updateProfilFriendList', {friendId:data.friendId});
									socket.emit('showSuccessMessage', {message:'Friend deleted successfully'});
								}
							}
						});
					}
				}
			});
		});

		socket.on('saveProfile',function(data){
			User.findById(data.userId).exec(function (error, user) {
				if (error) {
					return next(error);
				} else {
					if (user === null) {
						socket.emit('showError', {err: 'Not authorized! Go back!'});
					} else {
						
						user.email = data.email;
						user.username = data.username;
						user.save();
						socket.emit('showSuccessMessage', {message:'User Profile Updated Successfully'});
						
					}
				}
			});
		});
		

		socket.on('savePassword',function(data){
			User.findById(data.userId).exec(function (error, user) {
				if (error) {
					return next(error);
				} else {
					if (user === null) {
						socket.emit('showError', {err: 'Not authorized! Go back!'});
					} else {
						if (data.oldpwd != user.password)
						{
							socket.emit('showError', {err: 'wrong original password'});
						}
						else
						{
							user.password = data.newpwd;
							user.passwordConf = data.newpwdConfirm;
							user.save();
							socket.emit('showSuccessMessage', {message:'Password Updated Successfully'});
						}
					}
				}
			});
		});
		// When the client emits 'login', save his name and avatar,
		// and add them to the room
		socket.on('login', function(data) {

			var room = findClientsSocket(io, data.id);
			// Only two people per room are allowed
			if (room.length < 2) {

				// Use the socket object to store data. Each client gets
				// their own unique socket object

				socket.username = data.user;
				socket.userId = data.userId
				socket.room = data.id;
				socket.email = data.email
				socket.avatar = data.avatar;
				//socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});

				// Tell the person what he should use for an avatar
				socket.emit('img', socket.avatar);

				// Add the client to the room
				socket.join(data.id);
				console.log('userid:'+data.userId);
				//when switching page, the socket will be reconnected, thus need to update the login status here
				User.findById(data.userId)
					    .exec(function (error, user) {
					      if (error) {
					        console.log(error);
					      } else {
					        if (user === null) {
					          var err = new Error('Not authorized! Go back!');
					          err.status = 400;
					          console.log(err);
					        } else {
					          user.online= true;
					          user.save();
										console.log('update the reconnect status');
					        }
					      }
					    });

				chat.in(data.id).emit('startChat', {
					boolean: true,
					id: data.id
				});
			}
			else {
				socket.emit('tooMany', {boolean: true});
			}
		});

		socket.on('friendStatusChange', function(data) {
			connectedClients.push(data.userId);
			connectedSockets.push(socket.id);

			for (var i = 0; i < connectedClients.length-1; i++) {
				var socketId = connectedSockets[i];
				(function (socketId) {
					User.findById(connectedClients[i], function(err, user) {
						if (!err)
						{
							if (user != null)
							{
									User.find({'_id': {'$in' : user.friends.map(a => a.id)}},function(err, items) {
											console.log('socketid'+socketId);
											socket.broadcast.to(socketId).emit('refreshFriendList', items);
									});
							}
						}
					})
				}(socketId));
			}
		});

		// Somebody left the chat
		socket.on('disconnect', function() {
			console.log('disconnect');
			const index = connectedSockets.indexOf(socket.id);
			User.findById(connectedClients[index])
				    .exec(function (error, user) {
				      if (error) {
				        console.log(error);
				      } else {
				        if (user === null) {
				          var err = new Error('Not authorized! Go back!');
				          err.status = 400;
				          console.log(err);
				        } else {
				          user.online= false;
				          user.save();
				        }
				      }
				    });
			// Notify the other person in the chat room
			// that his partner has left
			connectedSockets.splice(index, 1);
			connectedClients.splice(index, 1);

			for (var i = 0; i < connectedClients.length; i++) {
				var socketId = connectedSockets[i];
				(function (socketId) {
					User.findById(connectedClients[i], function(err, user) {
						if (!err)
						{
							if (user != null)
							{
									User.find({'_id': {'$in' : user.friends.map(a => a.id)}},function(err, items) {
											console.log('socketid'+socketId);
											socket.broadcast.to(socketId).emit('refreshFriendList', items);
									});
							}
						}
					})
				}(socketId));
			}


			/*socket.broadcast.to(this.room).emit('leave', {
				boolean: true,
				room: this.room,
				user: this.username,
				avatar: this.avatar
			});*/

			// leave the room
			socket.leave(socket.room);


		});

		socket.on('videoChat', function(data){
	        socket.emit('created', {senderId:data.senderId, user: this.username, avatar:this.avatar});
				  socket.broadcast.to(this.room).emit('created', {senderId: data.senderId, user: this.username,avatar: this.avatar});
	        socket.emit('videoChatInvite', {senderId: data.senderId, avatar: this.avatar});
	        socket.broadcast.to(this.room).emit('videoChatInvite', {senderId: data.senderId, avatar: this.avatar});
	    });

		socket.on('audioChat', function(data){
						socket.emit('audiocreated', {senderId:data.senderId, user: this.username, avatar:this.avatar});
						socket.broadcast.to(this.room).emit('audiocreated', {senderId: data.senderId, user: this.username,avatar: this.avatar});
						socket.emit('audioChatInvite', {senderId: data.senderId, avatar: this.avatar});
						socket.broadcast.to(this.room).emit('audioChatInvite', {senderId: data.senderId, avatar: this.avatar});
				});



		socket.on('videoChatJoined', function(data){
					socket.emit('joined',{senderId:data.senderId, user: this.username, avatar:this.avatar});
				  socket.broadcast.to(this.room).emit('joined', {senderId:data.senderId, user: this.username, avatar:this.avatar});

					chat.in(data.senderId).emit('ready');
					socket.broadcast.to(this.room).emit('ready');
	    });

		socket.on('videoChatCancelled', function(data){
					chat.in(data.senderId).emit('videoChatSelfCancel', data.senderId);
					socket.broadcast.to(this.room).emit('videoChatSelfCancel', data.senderId);
		});

		socket.on('videoChatRejected', function(data){
					chat.in(data.senderId).emit('videoChatRefused', data.senderId);
					socket.broadcast.to(this.room).emit('videoChatRefused', data.senderId);
	    });


		socket.on('audioChatJoined', function(data){
						socket.emit('audiojoined',{senderId:data.senderId, user: this.username, avatar:this.avatar});
					  socket.broadcast.to(this.room).emit('audiojoined', {senderId:data.senderId, user: this.username, avatar:this.avatar});

						chat.in(data.senderId).emit('audioready');
						socket.broadcast.to(this.room).emit('audioready');
		    });

		socket.on('audioChatCancelled', function(data){
						chat.in(data.senderId).emit('audioChatSelfCancel', data.senderId);
						socket.broadcast.to(this.room).emit('audioChatSelfCancel', data.senderId);
			});

		socket.on('audioChatRejected', function(data){
						chat.in(data.senderId).emit('audioChatRefused', data.senderId);
						socket.broadcast.to(this.room).emit('audioChatRefused', data.senderId);
		    });


		socket.on('emailChatHistory', function(data){
			// When the server receives a message, it sends it to the other person in the room.
			var webshot = require('node-webshot');

			var options = {
			  shotSize: {
			    width: 'all'
			  , height: 'all'
			  }
			  , siteType:'html'
			};
			var chatHistoryImageName=Math.round((Math.random() * 1000000));
			var recipientEmail = this.email;
			webshot(data.emailtext, './public/chatScreenShot/chatHistory'+chatHistoryImageName+'.png', options, function(err) {
			  // screenshot now saved to hello_world.png
				emailChatTranscript(recipientEmail,'./public/chatScreenShot/chatHistory'+chatHistoryImageName+'.png', 'chatHistory'+chatHistoryImageName+'.png');
			});


		});

		// Handle the sending of messages
		socket.on('msg', function(data){
			var messageData = {
		      toUser: data.sendtoUserId,
		      fromUser: data.sendfromUserId,
		      sentDatetime: new Date(),
		      chatId: data.chatId,
		      message: data.msg,
					isImageMessage: data.isImage
		    }

		    Message.create(messageData, function (error, user) {
		      if (error) {
		        console.log(error);
		      }
		    });
			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('receive', {isImage: data.isImage, msg: data.msg, user: data.sendfromUserId, img: data.img, username:data.user});
		});

		socket.on('snapReceived', function(data){
			chat.in(data.senderId).emit('renderSnap', {buf:data.buf, senderId:data.senderId, user:this.username, img:this.avatar});
			socket.broadcast.to(this.room).emit('renderSnap', {buf:data.buf, senderId:data.senderId, user:this.username, img:this.avatar});
		});

		socket.on('message', function(data) {
			// for a real app, would be room-only (not broadcast)
			chat.in(data.senderId).emit('ice-message', data.message);
			socket.broadcast.to(this.room).emit('ice-message', data.message);
		});

		socket.on('message-audio', function(data) {
			// for a real app, would be room-only (not broadcast)
			chat.in(data.senderId).emit('ice-message-audio', data.message);
			socket.broadcast.to(this.room).emit('ice-message-audio', data.message);
		});

		socket.on('ipaddr', function() {
		    var ifaces = os.networkInterfaces();
		    for (var dev in ifaces) {
		      ifaces[dev].forEach(function(details) {
		        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
		          socket.emit('ipaddr', details.address);
		        }
		      });
		    }
		  });

	});
};

function emailChatTranscript(email, attachmentPath, attachmentName){
		var nodemailer = require('nodemailer');

		var transporter = nodemailer.createTransport({
		  service: 'gmail',
		  auth: {
		    user: 'chatubeapp@gmail.com',
		    pass: 'chatube531'
		  }
		});

		var msg = '<img src="cid:'+attachmentName+'" />'

		var mailOptions = {
		  from: 'chatubeapp@gmail.com',
		  to: email,
		  subject: 'Chat history',
		  html: msg,
		  attachments: [{
		        filename: attachmentName,
		        path: attachmentPath,
		        cid: attachmentName //same cid value as in the html img src
		    }]

		};
		transporter.sendMail(mailOptions, function(error, info){
		  if (error) {
		    console.log(error);
		  } else {
		    console.log('Email sent: ' + info.response);
		  }
		});

}


function findClientsSocket(io,roomId, namespace) {
	var res = [],
		ns = io.of(namespace ||"/");    // the default namespace is "/"

	if (ns) {
		for (var id in ns.connected) {
			if(roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId) ;
				if(index !== -1) {
					res.push(ns.connected[id]);
				}
			}
			else {
				res.push(ns.connected[id]);
			}
		}
	}
	return res;
}
