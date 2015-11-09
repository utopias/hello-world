var path = require('path');

var express = require('express');
var controller = require(path.join(process.env.PWD, './app/server/controllers/root'));

module.exports = function(app) {
  var router = express.Router();

  router
    .get('/', get)
    ;

  app.use('/', router);
};

function get(req, res) {
  var data = controller.get();

  return res.json(data);
}
