// This is the main file of our chat app. It initializes a new
// This is the main file of our chat app. It initializes a new
// express.js instance, requires the config and routes files
// and listens on a port. Start the application by running
// 'node app.js' in your terminal

const APIAI_TOKEN = '0fa7fd48b5da40c381c4342bda4215ad';
const APIAI_SESSION_ID = 'randomshit';
const conString = "mongodb://admin:admin1234@ds239117.mlab.com:39117/chatubesandbox"


var mongoose = require("mongoose"),
 session = require('express-session'),
 MongoStore = require('connect-mongo')(session),
 express = require('express'),
 fs=require('fs'),
 https = require('https');
 app = express();

const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;


mongoose.connect(conString);

var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("DB is connected")
});

//use sessions for tracking logins
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));


var options = {
  key: fs.readFileSync('./public/sslKeys/key.pem'),
  cert: fs.readFileSync('./public/sslKeys/cert.pem')
}

var httpsServer = https.createServer(options, app);

// This is needed if the app is run on heroku:

var port = process.env.PORT || 1024;

// Initialize a new socket.io object. It is bound to
// the express app, which allows them to coexist.

var io = require('socket.io')(httpsServer);


// Require the configuration and the routes files, and pass
// the app and io as arguments to the returned functions.


const apiai = require('apiai')(APIAI_TOKEN);


require('./config')(app, io);
require('./routes/routes')(app, io);


io.on('connection', function(socket) {
  socket.on('chat message', (text) => {
    console.log('Message: ' + text);

    // Get a reply from API.ai

    let apiaiReq = apiai.textRequest(text, {
      sessionId: APIAI_SESSION_ID
    });

    apiaiReq.on('response', (response) => {
      let aiText = response.result.fulfillment.speech;
      console.log('Bot reply: ' + aiText);
      socket.emit('bot reply', aiText);
    });

    apiaiReq.on('error', (error) => {
      console.log(error);
    });

    apiaiReq.end();

  });
});



httpsServer.listen(port, function(){
  console.log('Your application is running on https://localhost:' + port);
});

// Redirect from http port 80 to https
var http = require('http');
http.createServer(function (req, res) {
  console.log(req.url);
    res.writeHead(301, { "Location": "https://" + req.headers['host'].split(':')[0]+":"+port+ req.url });
    res.end();
}).listen(1025);
