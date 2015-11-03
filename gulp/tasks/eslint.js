module.exports = function(gulp, plugins, cfg) {
  gulp.task('eslint', function() {
    return gulp.src(cfg.eslint.src)
      .pipe(plugins.eslint())
      .pipe(plugins.eslint.format())
      .pipe(plugins.eslint.failOnError())
      ;
  });
};
