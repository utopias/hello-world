const express = require('express');
const path = require('path');
const controller = require(path.join(process.env.PWD, 'src/app/server/controllers/heartbeat'));

module.exports = function(app) {
  const router = express.Router();

  router
    .get('/', get)
    ;

  app.use('/heartbeat', router);
};

function get(req, res) {
  const data = controller.get();

  return res.json(data);
}
