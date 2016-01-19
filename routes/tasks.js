var express = require('express');
var router = express.Router();
var _dev = (process.env.NODE_ENV === "development") ? true : false;

//First thing, always export a list of incomplete tasks
exports.list = function(req, res, next){
    req.db.tasks.find({
        completed: false
    }).toArray(function(error, tasks){
        if (error) return next(error);
        
        //render the tasks template with an array
        res.render('tasks', {
            title: 'Todo List',
            //if tasks empty, return empty array
            tasks: tasks || []
        });
    });
}


exports.add = function (req, res, next) {
    //need name param to add task
    if (!req.body || !req.body.name)
        return next(new Error('No data provided.'));
    
    //db provided by middleware in app.js
    req.db.tasks.save({
        name: req.body.name,
        completed: false
    }, function (error, task){
        if (error) return next(error);
        if (!task) return next(new Error('Failed to save.'));
        
        //redirect back to the tasks page
        res.redirect('/tasks');
    });
}


exports.markAllCompleted = function (req, res, next) {
    if (_dev) console.log("In markAllCompleted");
    //check to see if this method was called from "add" button
    //instead of "all done" button
    if (!req.body.all_done || req.body.all_done !== "true") {
        if (_dev) console.log("Calling add");
        return next();
    }
    
    //update all incomplete tasks to completed
    req.db.tasks.update({
        completed: false
    }, {$set: {
        completed: true
        
    }}, {multi: true}, function(error, count){
        if (error) return next(error);
        console.info('Marked %s task(s) completed.',count);
        res.redirect('/tasks');
    });
};

exports.completed = function(req, res, next){
    console.info('In tasks.completed');
    req.db.tasks.find({
        completed:true 
    }).toArray(function(error,tasks){
        res.render('tasks_completed', {
            title: 'Completed',
            tasks: tasks || []
        });
    });
};

exports.markCompleted = function(req, res, next) {
    if (_dev) console.log("In markCompleted");
    if (!req.body.completed)
        return next(new Error('Param is missing.'));
    req.db.tasks.updateById(req.task._id, {
        $set: { completed: req.body.completed === 'true'}},
        function(error, count){
            if (error) return next(error);
            if (count !==1)
                return next(new Error('Something went wrong'));
            console.info('Marked task %s with id=%s completed.', req.task.name, req.task._id);
            
            res.redirect('/tasks');
        }
    )
};

exports.delete = function (req, res, next) {
    req.db.tasks.removeById(req.task._id, function (error, count){
        if (error) return next (error);
        if (count !== 1) return next(new Error('Something went wrong.'));
        console.info('Deleted task %s with id=%s',req.task.name, req.task._id);
        res.redirect('/tasks');
    });
};