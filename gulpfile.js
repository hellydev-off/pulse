'use strict';

const gulp         = require('gulp');
const sass         = require('gulp-sass')(require('sass'));
const postcss      = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCSS     = require('gulp-clean-css');
const concat       = require('gulp-concat');
const uglify       = require('gulp-uglify');
const twig         = require('gulp-twig');
const rename       = require('gulp-rename');
const sourcemaps   = require('gulp-sourcemaps');
const browserSync  = require('browser-sync').create();
const del          = require('del');

// ─── Paths ────────────────────────────────────────────────────────────────────
const paths = {
  scss: {
    entry: 'src/scss/main.scss',
    watch: 'src/scss/**/*.scss',
    dest:  'dist/css/',
  },
  js: {
    vendor: [
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/bootstrap-sass/assets/javascripts/bootstrap.min.js',
      'node_modules/swiper/swiper-bundle.min.js',
    ],
    src:  'src/js/**/*.js',
    dest: 'dist/js/',
  },
  twig: {
    pages: 'src/twig/pages/**/*.twig',
    watch: 'src/twig/**/*.twig',
    dest:  'dist/',
  },
  images: { src: 'src/images/**/*', dest: 'dist/images/' },
  fonts:  { src: 'src/fonts/**/*',  dest: 'dist/fonts/'  },
};

// ─── Clean ────────────────────────────────────────────────────────────────────
function clean() {
  return del(['dist']);
}

// ─── Styles (dev: sourcemaps) ─────────────────────────────────────────────────
function styles() {
  return gulp.src(paths.scss.entry)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      quietDeps: true,
      silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions', 'if-function'],
    }).on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.scss.dest))
    .pipe(browserSync.stream());
}

// ─── Styles (build: minified) ─────────────────────────────────────────────────
function stylesBuild() {
  return gulp.src(paths.scss.entry)
    .pipe(sass({
      outputStyle: 'compressed',
      quietDeps: true,
      silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions', 'if-function'],
    }).on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.scss.dest));
}

// ─── Scripts (dev: concatenated) ─────────────────────────────────────────────
function scripts() {
  return gulp.src([...paths.js.vendor, paths.js.src])
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest(paths.js.dest));
}

// ─── Scripts (build: minified) ───────────────────────────────────────────────
function scriptsBuild() {
  return gulp.src([...paths.js.vendor, paths.js.src])
    .pipe(concat('bundle.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.js.dest));
}

// ─── Twig → HTML ──────────────────────────────────────────────────────────────
function html() {
  return gulp.src(paths.twig.pages)
    .pipe(twig({
      base: 'src/twig/',
      data: {
        siteName: 'Пульсар',
        year: new Date().getFullYear(),
      },
    }))
    .pipe(gulp.dest(paths.twig.dest));
}

// ─── Images ───────────────────────────────────────────────────────────────────
function images() {
  return gulp.src(paths.images.src, { encoding: false, allowEmpty: true })
    .pipe(gulp.dest(paths.images.dest));
}

// ─── Fonts ────────────────────────────────────────────────────────────────────
function fonts() {
  return gulp.src(paths.fonts.src, { allowEmpty: true })
    .pipe(gulp.dest(paths.fonts.dest));
}

// ─── Bootstrap Glyphicons ─────────────────────────────────────────────────────
function bootstrapFonts() {
  return gulp.src('node_modules/bootstrap-sass/assets/fonts/**/*')
    .pipe(gulp.dest('dist/fonts/'));
}

// ─── Swiper CSS (vendor) ──────────────────────────────────────────────────────
function swiperCSS() {
  return gulp.src('node_modules/swiper/swiper-bundle.min.css')
    .pipe(gulp.dest('dist/css/'));
}

// ─── BrowserSync ──────────────────────────────────────────────────────────────
function serve(done) {
  browserSync.init({
    server: { baseDir: './dist' },
    port:   3000,
    notify: false,
    open:   true,
  });
  done();
}

function reload(done) {
  browserSync.reload();
  done();
}

// ─── Watch ────────────────────────────────────────────────────────────────────
function watching() {
  gulp.watch(paths.scss.watch, styles);
  gulp.watch(paths.js.src,     gulp.series(scripts, reload));
  gulp.watch(paths.twig.watch, gulp.series(html,    reload));
  gulp.watch(paths.images.src, gulp.series(images,  reload));
}

// ─── Composite tasks ──────────────────────────────────────────────────────────
const build = gulp.series(
  clean,
  gulp.parallel(styles, stylesBuild, scripts, scriptsBuild, html, images, fonts, bootstrapFonts, swiperCSS),
);

const dev = gulp.series(
  clean,
  gulp.parallel(styles, scripts, html, images, fonts, bootstrapFonts, swiperCSS),
  gulp.parallel(serve, watching),
);

exports.clean   = clean;
exports.styles  = styles;
exports.scripts = scripts;
exports.html    = html;
exports.images  = images;
exports.build   = build;
exports.default = dev;
