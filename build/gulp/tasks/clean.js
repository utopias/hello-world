const del = require('del');

module.exports = function(gulp, plugins, cfg) {
  gulp.task('clean', function(cb) {
    del.sync(cfg.clean.src);

    return cb();
  });
};
