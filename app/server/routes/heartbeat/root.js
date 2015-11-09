var express = require('express');
var path = require('path');
var controller = require(path.join(process.env.PWD, './app/server/controllers/heartbeat'));

module.exports = function(app) {
  var router = express.Router();

  router
    .get('/', get)
    ;

  app.use('/heartbeat', router);
};

function get(req, res) {
  var data = controller.get();

  return res.json(data);
}
