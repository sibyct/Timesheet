
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const mongoose = require('mongoose');
const hash = require('bcrypt-nodejs');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');

// mongoose
//mongoose.connect('mongodb://localhost:27017/timesheetDb');
mongoose.connect(config.mongoUri);
// user schema/model
const User = require('./models/user.js');

// create instance of express
const app = express();

// require routes
const routes = require('./routes/api.js');
const timeSheetroutes = require('./routes/userTimeSheetRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const pageRoutes = require('./routes/pageRoutes.js');

app.get('/', function (req, res) {
  res.redirect('/app/login');
});

// define middleware
app.use(express.static(path.join(__dirname, '../client')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(helmet());
app.use(cors());

// configure passport
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
/*app.get('/',function(req,res){
  console.log("enyter")
})*/
// routes
app.use('/user/', routes);
app.use('/time', timeSheetroutes);
app.use('/admin', adminRoutes);
app.use('/app', pageRoutes);


// error hndlers
app.use(require('./middleware/errorHandler').notFound);
app.use(require('./middleware/errorHandler').errorHandler);
mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open to ');
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});
module.exports = app;
