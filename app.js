var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

/**
 * Routers
 */
var indexRouter = require('./routes/index');
var chatRouter = require('./routes/chat');

var app = express();

/**
 * View engine setup.
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/chat', chatRouter);

/**
 * Catch 404 error and forward to handler.
 */
app.use(function (req, res, next) {
	next(createError(404));
});

/**
 * Error handler.
 */
app.use(function (err, req, res, next) {
	/**
	 * Debug mode development settings.
	 */
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	/**
	 * Rendering the error page.
	 */
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;