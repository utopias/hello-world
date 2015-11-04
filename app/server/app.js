// var express = require('express');
// var app = express();
var config = require('./helpers/config');
var logger = require('./helpers/logger')();

logger.info('Hello command line via bunyan!');
logger.info('Config:', config.get('app'));
