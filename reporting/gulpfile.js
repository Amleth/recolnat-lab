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
// TEST SERVER
//
gulp.task('html', function() {
  gulp.src('./build/index.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-deploy', ['html'], shell.task([
  'webpack -d --config webpack.production.config.js --progress --colors'
]));

gulp.task('deploy', ['build-deploy'], function() {
  gulp.src(distSrc)
    .pipe(sftp({
      host: 'wp5test.mnhn.fr',
      remotePath: '/home/cnamuser/www/status',
      user: 'cnamuser',
      pass: ""
    }));
});
