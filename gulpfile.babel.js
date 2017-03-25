import gulp from 'gulp';
import clean from 'gulp-clean';
import babel from 'gulp-babel';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import devServer from './dev/server';


gulp.task('build:clean', () => {
  return gulp.src('./bin').pipe(clean({ read: false }));
});

gulp.task('build:compile', ['build:clean'], () => {
  return gulp.src('./src/**/*.js')
             .pipe(babel())
             .pipe(gulp.dest('bin'));
});

gulp.task('build', ['build:clean', 'build:compile']);

gulp.task('serve:build-client-app', ['build'], () => {
  return browserify(['dev/app-src/app.js'])
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('app.js')) // First create a named file package
    .pipe(buffer()) // Then turn that fracker into a gulp-compatible package
    .pipe(gulp.dest('dev'));
})

gulp.task('serve', ['build', 'serve:build-client-app'], () => {
  devServer.listen(8080, () => {
    console.log('Dev server listening on port', 8080);
  });
});
