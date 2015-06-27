var gulp        = require('gulp');
var plugins     = require('gulp-load-plugins')();
var concat      = require('gulp-concat');
var ngAnnotate  = require('gulp-ng-annotate');
var karma       = require('karma').server;
var del         = require('del');
var inject      = require('gulp-inject');
var bowerFiles  = require('main-bower-files');
var ghPages     = require('gulp-gh-pages');
var Q           = require('q');
var plumber     = require('gulp-plumber');
var livereload  = require('gulp-livereload');
var webserver   = require('gulp-webserver');


//Configuration
var buildFolderName = 'build';
var releaseFolderName = 'release';
var buildFolder = __dirname + '/' + buildFolderName + '/';
var releaseFolder = __dirname + '/' + releaseFolderName + '/';

var paths = {
    scripts: ['src/app/**/*.module.js', 'src/app/**/*.js', '!src/app/**/*.spec.js'],
    styles: './src/content/**/*.css',
    index: './src/index.html',
    partials: ['src/app/**/*.html', '!src/index.html'],
    distDev: './dist.dev',
    distContentDev: './dist.dev/content',
    distVendorDev: './dist.dev/vendor',
    distScriptsDev: './dist.dev/app',
    distProd: './dist.prod',
    distContentProd: './dist.prod/content',
    distScriptsProd: './dist.prod/scripts',
    distVendorProd: './dist.prod/vendor'
};

//Tasks
gulp.task('test', function (done) {
    karma.start({
        configFile: __dirname + '/karma.config.js',
        singleRun: true
    }, done);
});

/**
 * Creates index.html file in  distribution path
 */
gulp.task('index',['clean'],function(){
    return gulp.src('./src/index.html')
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest(paths.distProd));
});

/**
 * Creates index.html file in development distribution path
 */
gulp.task('index-dev', function() {
    return gulp.src(paths.index)
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest(paths.distDev));
});

/**
 * Copies vendor files from bower to the build/vendor folder
 */
gulp.task('vendor', function () {
    return gulp.src(bowerFiles())
        .pipe(gulp.dest(paths.distVendorProd));
});

gulp.task('vendor-dev', function() {
    return gulp.src(bowerFiles())
        .pipe(gulp.dest(paths.distVendorDev));
});

/**
 * Compiles project application scripts into app.js and writes to distribution path
 */
gulp.task('scripts', function () {
    return gulp.src(paths.scripts)
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(concat('app.js'))
        .pipe(ngAnnotate())
        .pipe(gulp.dest(paths.distScriptsProd));
});

/**
 * Compiles project application scripts into the development distribustion location
 */
gulp.task('scripts-dev', function() {
    return gulp.src(paths.scripts)
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(ngAnnotate())
        .pipe(gulp.dest(paths.distScriptsDev))
});

/**
 * Processes application css to dist path
 */
gulp.task('css', function () {
    return gulp.src('./src/content/*.css')
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest(paths.distContentProd));
});

/**
 * Processes application css to dev dist path
 */
gulp.task('css-dev', function() {
    return gulp.src('./src/content/*.css')
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest(paths.distContentDev));
});


/**
 * Copies html partials files to dist path
 */
gulp.task('html', function () {
    return gulp.src(paths.partials)
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest(paths.distScriptsProd));
});

/**
 * Copies html partials files to dev dist path
 */
gulp.task('html-dev', function() {
    return gulp.src(paths.partials)
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest(paths.distScriptsDev));
});

/**
 * Injects release files into index.html
 */
gulp.task('inject', ['scripts', 'css', 'html', 'vendor'], function(){
    return gulp.src(paths.index)
        .pipe(gulp.dest(paths.distProd))
        .pipe(inject(gulp.src('./dist.prod/vendor/*.js', {read: false}), {name: 'bower', relative: true}))
        .pipe(inject(gulp.src('./dist.prod/vendor/*.css', {read: false}), {name: 'bower', relative: true}))
        .pipe(inject(gulp.src('./dist.prod/scripts/app.js', {read: false}), {relative: true}))
        .pipe(inject(gulp.src('./dist.prod/content/*.css', {read: false}), {relative: true}))
        .pipe(gulp.dest(paths.distProd));
});


/**
 * Updates the index.html file
 * with all the injections
 */
gulp.task('inject-dev', ['create-dev'], function(){
    return gulp.src(paths.index)
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest(paths.distDev))
        .pipe(inject(gulp.src([paths.distScriptsDev + '/**/*.module.js', paths.distScriptsDev + '/**/*.js'], {read: false}), {relative: true, name: ''}))
        .pipe(inject(gulp.src('./dist.dev/vendor/*.js', {read: false}), {name: 'bower', relative: true}))
        .pipe(inject(gulp.src('./dist.dev/vendor/*.css', {read: false}), {name: 'bower', relative: true}))
        .pipe(inject(gulp.src(paths.distContentDev + '/**/*.css',{read:false}), {relative: true}))
        .pipe(gulp.dest(paths.distDev));
});

/**
 * Creates development environment for testing
 */
gulp.task('create-dev', ['index-dev', 'vendor-dev', 'css-dev', 'html-dev', 'scripts-dev']);

/**
 * Builds a distribustion
 */
gulp.task('build', ['inject']);

/**
 * Builds a development distribution
 */
gulp.task('build-dev', ['inject-dev']);

/**
 * Cleans the build folder
 */
gulp.task('clean', function() {
    var deferred = Q.defer();
    del(paths.distProd, function() {
        deferred.resolve();
    });
    return deferred.promise;
});

/**
 * Removes all of dev dist files
 */
gulp.task('clean-dev', function() {
    var deferred = Q.defer();
    del(paths.distDev, function() {
        deferred.resolve();
    });
    return deferred.promise;
});

/**
 * Watches for file changes and rebuilds a development distribustion on change
 */
gulp.task('watch-dev', function() {
    livereload.listen();
    gulp.watch([paths.scripts, paths.partials, paths.styles, paths.index], ['build-dev']);
});

/**
 * Runs a static webserver for development files
 */
gulp.task('serve', ['build-dev', 'watch-dev'], function() {
    gulp.src('./dist.dev/')
        .pipe(webserver({
            fallback: 'index.html',
            livereload: true,
            directoryListing: false,
            open: true
        }));
});
