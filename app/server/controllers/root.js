var os = require('os');

var controller = {
  get: get
};

module.exports = controller;

function get() {
  return {
    message: 'OK',
    hostname: os.hostname()
  };
}
