var express = require('express');
var app = express();

var server;
var port = process.env.PORT;
var host = process.env.HOST;

app.get('/', function(req, res) {
  return res.send('Hello world!');
});

server = app.listen(port, host, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('%s@%s listening at http://%s:%s on Node', // eslint-disable-line
    process.env.npm_package_name,
    process.env.npm_package_version,
    host,
    port,
    process.version
  );
});

module.exports = server;
