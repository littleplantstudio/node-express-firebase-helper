var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

//Firebase Config
var firebase = require('firebase-admin');
var config = require('./config/dev');
if (process.env.NODE_ENV === 'production') {
  config = require('./config/prod');
}
firebase.initializeApp({
  databaseURL: config.firebase.databaseUrl,
  credential: firebase.credential.cert(require(config.firebase.configPath))
});
firebase.database.enableLogging(process.env.DEBUG);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(err);
});

module.exports = app;