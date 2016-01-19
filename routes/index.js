
/* GET home page. */
exports.index = function(req, res) {
    console.info('rendering index');
  res.render('index', { title: 'TODO APP' });
};


