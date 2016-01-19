var _dev = (process.env.NODE_ENV === "development") ? true : false;

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');

var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var csrf = require('csurf');
var bodyParser = require('body-parser');
var http = require('http');
var path = require('path');
var mongoskin = require('mongoskin');

var db = mongoskin.db('mongodb://localhost:27017/todo?auto_reconnect=true', {safe:true});

var routes = require('./routes');
var tasks = require('./routes/tasks');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, '/views'));

app.set('view engine', 'jade');

//app.use(favicon(path.join('public','favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride());
app.use(cookieParser(process.env.COOKIE_KEY));
app.use(session({
    secret: process.env.SESSION_SECRET ,
    resave: true,
    saveUninitialized: true
}));
app.use(csrf());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//middleware: mount the tasks collection on every request
app.use(function(req,res,next){
    console.log("connecting to DB");
    req.db={};
    req.db.tasks = db.collection('tasks'); 
    next();
});

//expose csrf token to templates, using response obj
app.use(function(req, res, next) {
    if (_dev) console.log('extracting csrf token');
    res.locals._csrf = req.csrfToken();
    return next();
});

//add appname to every jade template
app.locals.appname = 'Express.js Todo App';

//pull :task_id from every request
app.param('task_id', function (req, res, next, taskId){
    if (_dev) console.log('In app.param: extracting task_id: ', taskId);
    //mongoskin method to get tasks from db
    
    req.db.tasks.findById(taskId, function(error, task){
        //handle errors and empty results
       if (error) return next(error);
       if (!task) return next(new Error('Task not found.'));
       
       req.task = task;
       return next();
    });
});


//Routes
app.get('/', routes.index);
app.get('/tasks', tasks.list);
app.get('/tasks/completed', tasks.completed);

//handle both markAllCompleted and add tasks, 
//tasks.markAllCompleted will contain flow control
app.post('/tasks', tasks.markAllCompleted);
app.post('/tasks', tasks.add);
//mark just one task completed
app.post('/tasks/:task_id', tasks.markCompleted);
//delete a task
app.post('/delete/:task_id', tasks.delete);
//show the completed tasks page


//catch all bucket '*'
app.all('*',function(req,res){
    console.log('Unmatched route');
    res.status(404).send();
});

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
