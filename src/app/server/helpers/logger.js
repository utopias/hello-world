const bunyan = require('bunyan');
const bunyan2Loggly = require('bunyan-loggly').Bunyan2Loggly;

const config = require('./config');

module.exports = function() {
  const streams = [];

  if (config.get('BUNYAN_LOG_LEVEL') !== 'OFF') {
    streams.push({
      stream: process.stdout,
      level: config.get('BUNYAN_LOG_LEVEL')
    });
  }

  if (config.get('LOGGLY_TOKEN') && config.get('LOGGLY_SUBDOMAIN')) {
    streams.push({
      type: 'raw',
      level: config.get('LOGGLY_LOG_LEVEL'),
      stream: new bunyan2Loggly({
        token: config.get('LOGGLY_TOKEN'),
        subdomain: config.get('LOGGLY_SUBDOMAIN')
      })
    });
  }

  return bunyan.createLogger({
    name: config.get('npm_package_name'),
    streams: streams,
    serializers: bunyan.stdSerializers
  });
};
