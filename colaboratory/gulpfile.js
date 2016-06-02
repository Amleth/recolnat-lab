var gulp = require('gulp');
var sftp = require('gulp-sftp');
var shell = require('gulp-shell');
var rename = require('gulp-rename');

var distSrc = ['dist/*'];

//
// DEV
//

gulp.task('build-dev', ['conf-dev'], shell.task([
  'webpack-dev-server --devtool eval --progress --colors --content-base build --port 8089'
]));

gulp.task('conf-dev', function() {
  gulp.src('./conf/ApplicationConfiguration-dev.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

//
// DEV SERVER
//
gulp.task('html', function() {
  gulp.src('./build/index.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-deploy-dev', ['conf-deploy-dev', 'html'], shell.task([
  'webpack -d --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-deploy-dev', function() {
  gulp.src('./conf/ApplicationConfiguration-dev-server.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-dev', ['build-deploy-dev'], function() {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.mnhn.fr',
      remotePath: '/home/cnamuser/www/labo-dev',
      user: 'cnamuser',
      pass: ""
    }));
});

//
// TEST
//
gulp.task('html', function() {
  gulp.src('./build/index.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-test', ['conf-test', 'html'], shell.task([
  'webpack -p --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-test', function() {
  gulp.src('./conf/ApplicationConfiguration-test.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-test', ['build-test'], function() {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.mnhn.fr',
      remotePath: '/home/cnamuser/www/labo-test',
      user: 'cnamuser',
      pass: ""
    }));
});

//
// TEST DEMO
//
gulp.task('html', function() {
  gulp.src('./build/index.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-demo-test', ['conf-demo-test', 'html'], shell.task([
  'webpack -d --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-demo-test', function() {
  gulp.src('./conf/ApplicationConfiguration-demo-test.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-demo-test', ['build-demo-test'], function() {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.mnhn.fr',
      remotePath: '/home/cnamuser/www/demo-testing',
      user: 'cnamuser',
      pass: ""
    }));
});

//
// DEMO
//
gulp.task('html', function() {
  gulp.src('./build/index.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-demo', ['conf-demo', 'html'], shell.task([
  'webpack -p --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-demo', function() {
  gulp.src('./conf/ApplicationConfiguration-demo.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-demo', ['build-demo'], function() {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.mnhn.fr',
      remotePath: '/home/cnamuser/www/demo',
      user: 'cnamuser',
      pass: ""
    }));
});

//
// PROD
//
gulp.task('build-prod', ['conf-prod', 'html'], shell.task([
  'webpack -p --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-prod', function() {
  gulp.src('./conf/ApplicationConfiguration-prod.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-prod', ['build-prod'], function() {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5prod.mnhn.fr',
      remotePath: '/home/cnam/www/labo',
      user: 'cnam',
      pass: ""
    }));
});
