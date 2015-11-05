var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var routesDir = './app/server/routes';

module.exports = function(app) {
  var prioritizedMiddleware = [];

  // Normalize to absolute paths
  var routes = _.map(prioritizedMiddleware, function(mw) {
    return getRouteAbsolutePath(mw);
  });

  fs.readdirSync(__dirname).forEach(function(file) {
    if (file.toLowerCase() === 'index.js') {
      return; // We don't want to require index.js's
    }

    var filePath  = path.join(__dirname, file.split('.js').join(''));

    // If route isn't in the list already, lets add it to the list
    if (routes.indexOf(filePath) === -1) {
      routes.push(filePath);
    }
  });

  // Finally register the routes with the app
  _.each(routes, function(mw) {
    require(mw)(app);
  });
};

function getRouteAbsolutePath(relativeToRoutesDirPath) {
  return path.join(process.env.PWD, routesDir, relativeToRoutesDirPath);
}
