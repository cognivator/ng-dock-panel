(function () {
  "use strict";
  var path = require('path');

  var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    pump = require('pump'),
    combiner = require('stream-combiner2'),
    del = require('del');

  var root = __dirname,
    libroot = path.join(root, 'lib'),
    stageroot = path.join(root, 'stage');

  var sassOptions = {
    outputStyle: 'expanded'
  };

  gulp.task('clean-stage', function() {
    cleanStage();
  });

  gulp.task('lint-styles', function (cb) {
    pump([
      gulp.src(path.join(libroot, '**', '*.scss')),
      lintScss(),
      gulp.dest(stageroot)
    ], cb);
  });

  gulp.task('build-module', function (cb) {
    pump([
      gulp.src([path.join(libroot, '**', '*.module.js'), path.join(libroot, '**', '*.js')]),
      plugins.concat('ng-dock-panel.js'),
      plugins.flatten(),
      gulp.dest(root),
      plugins.uglify(),
      plugins.rename({extname: '.min.js'}),
      gulp.dest(root)
    ], cb);
  });

  gulp.task('build-styles', ['lint-styles'], function (cb) {
    var processors = [
      require('cssnano')
    ];

    pump([
      gulp.src(path.join(stageroot, '**', '*.scss')),
      plugins.sass(sassOptions),
      plugins.flatten(),
      gulp.dest(root),
      plugins.postcss(processors),
      plugins.rename({extname: '.min.css'}),
      gulp.dest(root)
    ], cb);
  });

  gulp.task('build', ['build-styles', 'build-module']);

  gulp.task('default', function(done) {
    plugins.sequence('build', 'clean-stage', done);
  });


  //// HELPERS ////
  function lintScss() {
    var processors = [
        require('postcss-unprefix'),
        require('postcss-class-prefix')('dock-', {ignore: [/ng-/, /dock-/, /ui-/]}),
        require('autoprefixer'),
        require('stylelint')
      ],
      syntax = require('postcss-scss');

    return combiner(
      plugins.postcss(processors, {syntax: syntax})
    );
  }

  function cleanStage() {
    del.sync(stageroot);
  }
})();