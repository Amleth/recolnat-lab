var gulp = require('gulp');
var sftp = require('gulp-sftp');
var shell = require('gulp-shell');
var rename = require('gulp-rename');

var distSrc = ['dist/*'];

//
// DEV LOCAL
//

gulp.task('build-dev-local', ['conf-dev-local'], shell.task([
  'webpack-dev-server --devtool eval --progress --colors --content-base build --port 8089'
]));

gulp.task('conf-dev-local', function () {
  gulp.src('./conf/ApplicationConfiguration-dev-local.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

//
// DEV
//

gulp.task('build-dev', ['conf-dev'], shell.task([
  'webpack-dev-server --devtool eval --progress --colors --content-base build --port 8089'
]));

gulp.task('conf-dev', function () {
  gulp.src('./conf/ApplicationConfiguration-dev.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

//
// DEV SERVER
//
gulp.task('copy', function () {
  gulp.src('build/*', {base: 'build/'})
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-deploy-dev', ['conf-deploy-dev', 'copy'], shell.task([
  'webpack -d --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-deploy-dev', function () {
  gulp.src('./conf/ApplicationConfiguration-dev.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-dev', ['build-deploy-dev'], function () {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.recolnat.org',
      remotePath: '/home/cnamuser/www/labo-dev',
      user: 'cnamuser',
      pass: ''
    }));
});

//
// TEST
//

gulp.task('build-test', ['conf-test', 'copy'], shell.task([
  'webpack -p --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-test', function () {
  gulp.src('./conf/ApplicationConfiguration-test.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-test', ['build-test'], function () {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.recolnat.org',
      remotePath: '/home/cnamuser/www/labo-test',
      user: 'cnamuser',
      pass: ''
    }));
});

//
// PROD-VM
//
gulp.task('build-prod-vm', ['conf-prod-vm', 'copy'], shell.task([
  'webpack -p --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-prod-vm', function () {
  gulp.src('./conf/ApplicationConfiguration-prod-vm.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-prod-vm', ['build-prod-vm'], function () {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.recolnat.org',
      remotePath: '/apps/recolnat/lab/vm/www',
      user: 'cnamuser',
      pass: ''
    }));
});

//
// PROD
//
gulp.task('build-prod', ['conf-prod', 'copy'], shell.task([
  'webpack -p --config webpack.production.config.js --progress --colors'
]));

gulp.task('conf-prod', function () {
  gulp.src('./conf/ApplicationConfiguration-prod-vm.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('deploy-prod', ['build-prod'], function () {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5prod.recolnat.org',
      remotePath: '/path/to/www/recolnat',
      user: '',
      pass: ''
    }));
});