var path = require('path');
var shell = require('shelljs');
var validEnvironments = {
  local: 'local',
  loc: 'local',
  ci: 'dev',
  dev: 'dev',
  development: 'dev',
  prod: 'prod',
  production: 'prod'
};

var cfg = {
  env: validEnvironments[process.env.NODE_ENV || ''] || validEnvironments.local,
  stylint: {
    src: [
      path.join(__dirname, '../app/client/**/*.styl')
    ]
  },
  eslint: {
    src: [
      path.join(__dirname, '../app/client/**/*.js'),
      path.join(__dirname, '../app/server/**/*.js'),
      path.join(__dirname, '../gulp/**/*.js'),
      path.join(__dirname, '../test/**/*.js'),
      path.join('!' + __dirname, '../app/client/statics/**/*.js'),
      path.join('!' + __dirname, '../**/*.min.js')
    ]
  },
  nodemon: {
    script: path.join(__dirname, '..', process.env.npm_package_main),
    ext: 'js',
    ignore: [
      path.join(__dirname, '../gulp/*.js')
    ]
  }
};

cfg.git = {
  commit: (shell.exec('git rev-parse --verify HEAD', {silent: true}).output || '').split('\n').join(''),
  branch: (shell.exec('git rev-parse --abbrev-ref HEAD', {silent: true}).output || '').split('\n').join('')
};

module.exports = cfg;
