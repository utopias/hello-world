const path = require('path');

module.exports = function(app) {
  require('fs').readdirSync(__dirname).forEach(function(file) {
    if (file.toLowerCase() === 'index.js') {
      return;
    }

    const filePath  = path.join(__dirname, file.split('.js').join(''));

    require(filePath)(app, path);
  });
};
