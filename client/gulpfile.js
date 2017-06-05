var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    modRewrite = require('connect-modrewrite'),
    sass = require('gulp-sass'),
    runSequence = require('run-sequence');

gulp.task('browser-sync', function () {
    /** Runs the web app currently under development and watches the filesystem for changes */

    // Specify list of files to watch for changes, apparently reload method doesn't work on Windows */
    var filesToWatch = [
        './**/*.html',
        './**/*.js'
    ];

    // Create a rewrite rule that redirects to index.html to let Angular handle the routing
    browserSync.init(filesToWatch, {
        server: {
            baseDir: "./",
            middleware: [
                modRewrite([
                    '!\\.\\w+$ /index.html [L]'
                ])
            ]
        }
    });
});

gulp.task('compile-sass', function () {
    /** Creates a CSS file from the SCSS files */
    return gulp.src('assets/styles/sass/dmis.scss')
        .pipe(sass({
                outputStyle: 'expanded',
                precision: 10,
                includePaths: 'node_modules/bootstrap-sass/assets/stylesheets'
            }
        ).on('error', sass.logError))
        .pipe(gulp.dest('assets/styles/css/'));
});

gulp.task('run', function (callback) {
    runSequence('compile-sass',
        'browser-sync',
        callback
    );
});