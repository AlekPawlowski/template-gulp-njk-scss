let currentDate = new Date();

const gulp = require('gulp'),
    {watch, series, dest, src} = require('gulp'),
    njk = require('nunjucks'),
    renderNjk = require('gulp-nunjucks-render'),
    sass = require('gulp-sass')(require('sass')),
    clean = require('gulp-clean'),
    sourcemap = require('gulp-sourcemaps'),
    browserSync = require('browser-sync').create(),
    fs = require('fs'),
    changeFileContent = require('gulp-change-file-content');

const config = {
    dist: './build',
    src: "./src",
    njkViews: "/views/sites/**",
    njkIndex: "/views/index.njk",
    style: "/style/style.scss",
    script: "/js/app.js",
    img: '/assets/img/**',
    json: '/assets/json/**',
    version: `${currentDate.getMonth()}${currentDate.getDate()}${currentDate.getHours()}${currentDate.getMinutes()}`,
}

const nunjucks = (path) => {
    return src(`${config.src}${path}`)
        .pipe(renderNjk({path: ['./src/views']}))
        .pipe(changeFileContent((content) => updateHtmlVersionOfCssAndJs(content)))
        .pipe(dest(config.dist+"/"))
        .pipe(browserSync.stream())
}

const nunjucksViews = () => nunjucks(config.njkViews);
const nunjucksIndex = () => nunjucks(config.njkIndex);

const sassBuild = () => {
    return src(`${config.src}${config.style}`)
        .pipe(sourcemap.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemap.write('.'))
        .pipe(dest(`${config.dist}/css`))
        .pipe(browserSync.stream())

}

const jsBuild = () => {
    return src(`${config.src}/js/**`)
        .pipe(changeFileContent((content, path) => updateVersionOfImportedJs(content, path)))
        .pipe(dest(`${config.dist}/js`))
        .pipe(browserSync.stream())
}

const moveFonts = () => {
    return src(`${config.src}/assets/fonts`)
       .pipe(dest(`${config.dist}`))
}

const moveImg = () => {
    return src(`${config.src}${config.img}`)
       .pipe(dest(`${config.dist}/img`))
}

const moveJsonFiles = () => {
    return src(`${config.src}${config.json}`)
       .pipe(dest(`${config.dist}/json`))
}


const cleanUpDistFolder = () => {
    return src(`${config.dist}/`).pipe(clean({force: true}))
}

const build = async () => {
    nunjucksViews();
    nunjucksIndex();
    jsBuild();
    sassBuild();
    moveImg();
    moveJsonFiles();
}


const serve = async () => {
    browserSync.init({
        server: config.dist,
        browser: "brave"
    });
    watch([`${config.src}/js/**`], series(jsBuild));
    watch([`${config.src}/style/**`], series(sassBuild));
    watch([`${config.src}${config.json}/**`], series(moveJsonFiles));
    watch([`${config.src}${config.img}/**`], series(moveImg));
    watch([`${config.src}/views/**`], series(nunjucksIndex, nunjucksViews));
}

exports.build = series(cleanUpDistFolder, build);
exports.default = series(cleanUpDistFolder, build, serve);

function updateVersionOfImportedJs(content, path) {
    if (content.includes("import ") || content.includes("import(")) {
        content = content.replace(/.js"/g, `.js?v=${config.version}"`);
        content = content.replace(/.js'/g, `.js?v=${config.version}"`);
    }
    return content;
}

function updateHtmlVersionOfCssAndJs(content) {
    content = content.replace(/app.js"/g, `app.js?v=${config.version}"`);
    content = content.replace(/style.css"/g, `style.css?v=${config.version}"`);
    return content;
}