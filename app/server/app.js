var express = require('express');
var app = express();

var config = require('./helpers/config');
var logger = require('./helpers/logger')();

var server;
var port = config.get('PORT');
var host = config.get('HOST');

app.get('/', function(req, res) {
  return res.send('Hello world!');
});

server = app.listen(port, host, function() {
  var host = server.address().address;
  var port = server.address().port;

  logger.info('%s@%s listening at http://%s:%s on Node', // eslint-disable-line
    config.get('npm_package_name'),
    config.get('npm_package_version'),
    host,
    port,
    process.version
  );
});

module.exports = server;
