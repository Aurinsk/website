const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('connect-flash');
const session = require('express-session');
const favicon = require('serve-favicon');

const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const logoutRouter = require('./routes/logout');
const dashboardRouter = require('./routes/dashboard');
const reportRouter = require('./routes/report');
const waitingListRouter = require('./routes/waitinglist');
const discordRouter = require('./routes/discord');

const pjson = require('./package.json');

const app = express();

// favicon
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.static('public', {dotfiles: 'allow'}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

if (process.env.NODE_ENV === 'PRODUCTION') {
  app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "DEVELOPMENT") {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  })
} else {
  app.use(logger('dev'));
}

// routes
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/logout', logoutRouter);
app.use('/dashboard', dashboardRouter);
app.use('/report', reportRouter);
app.use('/waitinglist', waitingListRouter);
app.use('/discord', discordRouter);

// save website version
app.set('buildVersion', pjson.version);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
