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

//Configuration
var buildFolderName = 'build';
var releaseFolderName = 'release';
var buildFolder = __dirname + '/' + buildFolderName + '/';
var releaseFolder = __dirname + '/' + releaseFolderName + '/';

var paths = {
    scripts: 'src/app/**/*.js',
    styles: ['./src/app/**/*.css', './src/app/**/*.scss'],
    index: './src/index.html',
    partials: ['src/app/**/*.html', '!src/index.html'],
    distDev: './dist.dev',
    distContentDev: './dist.dev/content',
    distVendorDev: './dist.dev/vendor',
    distScriptsDev: './dist.dev/app',
    distProd: './dist.prod',
    distScriptsProd: './dist.prod/scripts'
};

//Tasks
gulp.task('test', function (done) {
    karma.start({
        configFile: __dirname + '/karma.config.js',
        singleRun: true
    }, done);
});

gulp.task('index',['clean'],function(){
    return gulp.src('./src/index.html')
        .pipe(gulp.dest('./build'));
});


/**
 * Copies vendor files from bower to the build/vendor folder
 */
gulp.task('vendor', function () {
    return gulp.src(bowerFiles())
        .pipe(gulp.dest('./build/vendor'));
});

gulp.task('vendor-dev', function() {
    return gulp.src(bowerFiles())
        .pipe(gulp.dest(paths.distVendorDev));
});

/**
 * Cleans the build folder
 */
gulp.task('clean', function() {
    del(buildFolder + '**');
});

/**
 * Concats application js files into app.js
 */
gulp.task('concat', function () {
    return gulp.src(['src/app/**/*.module.js', 'src/app/**/*.js', '!src/app/**/*.spec.js'])
        .pipe(concat('app.js'))
        .pipe(ngAnnotate())
        .pipe(gulp.dest(buildFolder));
});

gulp.task('concat-dev', function() {
    return gulp.src(['src/app/**/*.module.js', 'src/app/**/*.js', '!src/app/**/*.spec.js'])
        .pipe(ngAnnotate())
        .pipe(gulp.dest(paths.distScriptsDev))
});

gulp.task('index-dev', function() {
    return gulp.src(paths.index)
        .pipe(gulp.dest(paths.distDev));
});

/**
 * Copies application css to build folder
 */
gulp.task('css', function () {
    return gulp.src('./src/content/*.css')
        .pipe(gulp.dest('./build/content'));
});

gulp.task('css-dev', function() {
    return gulp.src('./src/content/*.css')
        .pipe(gulp.dest(paths.distContentDev));
});

/**
 * Copies application css to build folder
 */
gulp.task('images', function () {
    return gulp.src('./src/content/*.png')
        .pipe(gulp.dest('./build/content'));
});

/**
 * Copies html files to build folder
 */
gulp.task('html', function () {
    return gulp.src('./src/app/**/*.html')
        .pipe(gulp.dest('./build/app'));
});

gulp.task('html-dev', function() {
    return gulp.src('./src/app/**/*.html')
        .pipe(gulp.dest(paths.distScriptsDev));
});

/**
 * Injects release files into index.html
 */
gulp.task('inject', ['concat', 'css', 'html', 'vendor'], function(){
    return gulp.src('./src/index.html')
        .pipe(gulp.dest('./build'))
        .pipe(inject(gulp.src('./build/vendor/*.js', {read: false}), {name: 'bower', relative: true}))
        .pipe(inject(gulp.src('./build/vendor/*.css', {read: false}), {name: 'bower', relative: true}))
        .pipe(inject(gulp.src('./build/app.js', {read: false}), {relative: true}))
        .pipe(inject(gulp.src('./build/content/*.css', {read: false}), {relative: true}))
        .pipe(gulp.dest('./build'));
});


/**
 * Updates the index.html file
 * with all the injections
 */
gulp.task('inject-dev', ['create-dev'], function(){
    return gulp.src(paths.index)
        .pipe(gulp.dest(paths.distDev))
        .pipe(inject(gulp.src([paths.distScriptsDev + '/**/*.module.js', paths.distScriptsDev + '/**/*.js'], {read: false}), {relative: true, name: ''}))
        .pipe(inject(gulp.src('./dist.dev/vendor/*.js', {read: false}), {name: 'bower', relative: true}))
        .pipe(inject(gulp.src('./dist.dev/vendor/*.css', {read: false}), {name: 'bower', relative: true}))
        .pipe(inject(gulp.src(paths.distContentDev + '/**/*.css',{read:false}), {relative: true}))
        .pipe(gulp.dest(paths.distDev));
});


gulp.task('create-dev', ['index-dev', 'vendor-dev', 'css-dev', 'html-dev', 'concat-dev']);

gulp.task('build', ['inject', 'images']);

gulp.task('build-dev', ['inject-dev']);

gulp.task('deploy', ['build'], function(){
    return gulp.src('./build/**/*')
        .pipe(ghPages());
});

// removes all compiled dev files
gulp.task('clean-dev', function() {
    var deferred = Q.defer();
    del(paths.distDev, function() {
        deferred.resolve();
    });
    return deferred.promise;
});
