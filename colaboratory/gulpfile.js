const gulp = require('gulp');
const sftp = require('gulp-sftp');
const shell = require('gulp-shell');
const rename = require('gulp-rename');

const distSrc = ['out/*'];

//
// Local develoment with webpack-dev-server
//

gulp.task('dev-local', ['dev-local-conf'], shell.task([
  'webpack --config webpack.config.js --colors'
]));

gulp.task('dev-local-conf', function () {
  gulp.src('./conf/ApplicationConfiguration-dev-local.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

// Build & deploy on remote development server

gulp.task('remote-dev-conf', function () {
  gulp.src('./conf/ApplicationConfiguration-dev.js')
    .pipe(rename('ApplicationConfiguration.js'))
    .pipe(gulp.dest('./src/conf'));
});

gulp.task('remote-dev-build', ['remote-dev-conf'], shell.task([
  'webpack --config webpack.config.js --colors'
]));

gulp.task('remote-dev-build-watch', ['remote-dev-conf'], shell.task([
  'webpack --config webpack.config.js --colors --watch '
]));

gulp.task('remote-dev-deploy', [], function () {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.recolnat.org',
      remotePath: '/home/cnamuser/www/labo-dev',
      user: 'cnamuser',
      pass: process.env.DEV_SERVER_PASSWORD
    }));
});

/*

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
 pass: process.env.DEV_SERVER_PASSWORD
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
 pass: process.env.DEV_SERVER_PASSWORD
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
 pass: process.env.PROD_SERVER_PASSWORD
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
 pass: process.env.PROD_SERVER_PASSWORD
 }));
 });

 */