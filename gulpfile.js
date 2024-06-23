const { src, dest, task, series, watch, parallel } = require("gulp");
const rm = require('gulp-rm');
const sass = require('gulp-sass')(require('sass'));
const rename = require("gulp-rename");
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const gulpif = require('gulp-if');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

const env = process.env.NODE_ENV;

const { SRC_PATH, DIST_PATH } = require('./gulp.config');


task('clean', () => {
  return src(`${DIST_PATH}/*`, { read: false })
    .pipe(rm())
})

task('copy:html', () => {
  return src(`${SRC_PATH}/*.html`)
    .pipe(dest(DIST_PATH))
    .pipe(reload({ stream: true }));
})

task('copy:img', () => {
  return src(`${SRC_PATH}/images/**/*`)
    .pipe(dest(`${DIST_PATH}/images`))
})

task('scripts', () => {
  return src('src/scripts/*.js')
    
    .pipe(concat('main.min.js', { newLine: ';' }))
    .pipe(gulpif(env === 'prod', babel({
      presets: ['@babel/env']
    })))
    .pipe(gulpif(env === 'prod', uglify()))
    
    .pipe(dest(DIST_PATH))
    .pipe(reload({ stream: true }));
});

task('styles', () => {
  return src('src/sass/main.sass')
    .pipe(gulpif(env === 'dev', sourcemaps.init()))
    .pipe(rename({suffix: '.min', prefix: ''}))
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(env === 'prod', autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    })))
    .pipe(gulpif(env === 'prod', gcmq()))
    .pipe(gulpif(env === 'prod', cleanCSS()))
    .pipe(gulpif(env === 'dev', sourcemaps.write()))
    .pipe(dest(DIST_PATH))
    .pipe(reload({ stream: true }));
});

task('server', () => {
  browserSync.init({
    server: {
      baseDir: `./${DIST_PATH}`
    },
    open: false
  });
});

task('watch', () => {
  watch('./src/sass/**/*.sass', series('styles'));
  watch('./src/*.html', series('copy:html'));
  watch('./src/images/**/*', series('copy:img'));
  watch('./src/scripts/*.js', series('scripts'));
});


task('default',
  series(
    'clean',
    parallel('copy:html', 'copy:img'),
    parallel('styles', 'scripts'),
    parallel('watch', 'server')
  )
);

task('build',
  series(
    'clean',
    parallel('copy:html', 'copy:img'),
    parallel('styles', 'scripts'))
);