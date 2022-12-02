const path = require('path');
const gulp = require('gulp');
const rimraf = require('rimraf');
var minimatch = require('minimatch');
const less = require('gulp-less');
const glob = require('glob');
// const lessImport = require('gulp-less-import');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
// const gulpIf = require('gulp-if');
const autoprefix = require('less-plugin-autoprefix');
const alias = require('gulp-path-alias');


const { buildScript, buildBrowser, styleScriptBuild } = require('./build');

const getProjectPath = (paths) => path.join(__dirname, '../', paths);
const outputDirName = './dist';
const outputDir = getProjectPath(outputDirName);
const umdDir = getProjectPath(`${outputDirName }/dist`);
const esDir = getProjectPath(`${outputDirName }/es`);
const cjsDir = getProjectPath(`${outputDirName }/lib`);

// less 全局变量文件
const varsPath = getProjectPath('./src/components/style/index.less');

function globArray(patterns, options) {
  var i,
    list = [];
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }
  patterns.forEach(function(pattern) {
    if (pattern[0] === '!') {
      i = list.length - 1;
      while (i > -1) {
        if (!minimatch(list[i], pattern)) {
          list.splice(i, 1);
        }
        i--;
      }
    } else {
      var newList = glob.sync(pattern, options);
      newList.forEach(function(item) {
        if (list.indexOf(item) === -1) {
          list.push(item);
        }
      });
    }
  });
  return list;
}

// 编译less
function compileLess(cb, outputCssFileName = 'ti.css') {
  gulp.src(['src/**/style/**/*.less', 'src/style/**/*.less'])
    .pipe(
      alias({
        paths: {
          '~@': path.resolve('./src'),
        },
      }),
    )
    .pipe(gulp.dest(esDir)) // 拷贝一份less es
    .pipe(gulp.dest(cjsDir)) // 拷贝一份less cjs
    .pipe(
      less({
        plugins: [autoprefix],
        globalVars: {
          hack: `true; @import "${varsPath}"`,
        },
      }),
    )
    .pipe(
      rename(function(path) {
        return {
          ...path,
          extname: '.css',
        };
      }),
    )
    .pipe(gulp.dest(esDir)) // 输出css es
    .pipe(gulp.dest(cjsDir)) // 输出css cjs
    .pipe(concat(outputCssFileName))
    .pipe(gulp.dest(umdDir));
  cb();
}

// 编译ts
function compileTypescript(cb) {
  const source = [
    'src/**/*.tsx',
    'src/**/*.ts',
    'src/**/*.d.ts',
    '!src/**/__test__/**',
    '!src/**/style/*.ts',
  ];

  const tsFiles = globArray(source);

  console.log('tsFiles', tsFiles);
  buildScript(
    tsFiles,
    {
      es: esDir,
      cjs: cjsDir,
    },
    cb,
  )
    .then(() => {
      cb();
    })
    .catch((err) => {
      console.log('---> build err', err);
    });
  // 单文件输出
  buildBrowser('src/index.ts', umdDir, cb);
  cb();
}

// 提供给babel-import-plugin使用的样式脚本文件处理
function styleScriptTask(cb) {
  const files = glob.sync('src/**/style/*.ts');
  console.log('files', files);
  styleScriptBuild(files, { es: esDir, cjs: cjsDir });
  cb();
}

// 清空源文件
function removeDist(cb) {
  rimraf.sync(outputDir);
  cb();
}

exports.default = gulp.series(
  removeDist,
  gulp.parallel(compileLess, styleScriptTask, compileTypescript ),
);
