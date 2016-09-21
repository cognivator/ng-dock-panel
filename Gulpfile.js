(function () {
  "use strict";
  var path = require('path'),
      fs = require('fs');

  var gulp = require('gulp'),
      $G = require('gulp-load-plugins')(),
      pump = require('pump'),
      combiner = require('stream-combiner2'),
      del = require('del'),
      conventionalGithubReleaser = require('conventional-github-releaser');

  var yargs = require('yargs'),
      argv = yargs.argv;

  var root = __dirname,
      libroot = path.join(root, 'lib'),
      stageroot = path.join(root, 'stage');

  var files = {
    CHANGELOG: 'CHANGELOG.md'
  };

  var sassOptions = {
    outputStyle: 'expanded'
  };


  //// RELEASE

  gulp.task('recommend-bump', function () {
    var cmd = 'conventional-recommended-bump -p angular';

    var options = {
      pipeStdout: true
    };

    gulp.src('')
        .pipe($G.exec(cmd, options))
        .pipe($G.tap(function (file) {
          console.log(file.contents && file.contents.toString());
        }));
  });


  gulp.task('bump-version', function (done) {
    // Set command argument `--bump <type>` to specify 'major', 'minor' or a 'patch' [default] change.
    // Use task 'recommend-bump' to get a suggested type based on commit structure.
    var type = argv.bump || 'patch';

    pump([
      gulp.src(['./package.json']),
      $G.bump({type: type}).on('error', $G.util.log),
      gulp.dest('./')
    ], done);
  });

  gulp.task('changelog', function (done) {
    pump([
      gulp.src(files.CHANGELOG, {
        buffer: false
      }),
      $G.conventionalChangelog({
        preset: 'angular' // Or to any other commit message convention you use.
      }),
      gulp.dest('./')
    ], done);
  });

  gulp.task('commit-changes', function (done) {
    pump([
      gulp.src('.'),
      $G.git.add(),
      $G.git.commit('[Prerelease] Bumped version number')
    ], done);
  });

  gulp.task('push-changes', function (done) {
    $G.git.push('origin', 'master', done);
  });

  gulp.task('create-new-tag', function (done) {
    var version = getPackageJsonVersion();
    $G.git.tag(version, 'Created Tag for version: ' + version, function (error) {
      if (error) {
        return done(error);
      }
      $G.git.push('origin', 'master', {args: '--tags'}, done);
    });

    function getPackageJsonVersion() {
      // We parse the json file instead of using require because require caches
      // multiple calls so the version number won't be updated
      return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
    }
  });

  /*
   gulp.task('github-release', function (done) {
   conventionalGithubReleaser({
   // TODO:1 Modify for this project
   type: "oauth",
   token: '0126af95c0e2d9b0a7c78738c4c00a860b04acc8' // change this to your own GitHub token or use an environment variable
   }, {
   preset: 'angular' // Or to any other commit message convention you use.
   }, done);
   });
   */

  gulp.task('release', function (done) {
    $G.sequence(
        'bump-version',
        'changelog',
        'commit-changes',
        'push-changes',
        'create-new-tag',
        // 'github-release',
        function (error) {
          if (error) {
            console.log(error.message);
          } else {
            console.log('RELEASE FINISHED SUCCESSFULLY');
          }
          done(error);
        });
  });


  //// BUILD
  gulp.task('clean-stage', function () {
    cleanStage();
  });

  gulp.task('lint-styles', function (done) {
    pump([
      gulp.src(path.join(libroot, '**', '*.scss')),
      lintScss(),
      gulp.dest(stageroot)
    ], done);
  });

  gulp.task('build-module', function (done) {
    pump([
      gulp.src([path.join(libroot, '**', '*.module.js'), path.join(libroot, '**', '*.js')]),
      $G.concat('ng-dock-panel.js'),
      $G.flatten(),
      gulp.dest(root),
      $G.uglify(),
      $G.rename({extname: '.min.js'}),
      gulp.dest(root)
    ], done);
  });

  gulp.task('build-styles', ['lint-styles'], function (done) {
    var processors = [
      require('cssnano')
    ];

    pump([
      gulp.src(path.join(stageroot, '**', '*.scss')),
      $G.sass(sassOptions),
      $G.flatten(),
      gulp.dest(root),
      $G.postcss(processors),
      $G.rename({extname: '.min.css'}),
      gulp.dest(root)
    ], done);
  });

  gulp.task('build', ['build-styles', 'build-module']);


  //// DEFAULT
  gulp.task('default', function (done) {
    $G.sequence('build', 'clean-stage', done);
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
        $G.postcss(processors, {syntax: syntax})
    );
  }

  function cleanStage() {
    del.sync(stageroot);
  }
})();
