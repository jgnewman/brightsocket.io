import gulp from 'gulp';
import clean from 'gulp-clean';
import babel from 'gulp-babel';
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


gulp.task('serve', ['build'], () => {
  devServer.listen(8080, () => {
    console.log('Dev server listening on port', 8080);
  });
});
