const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const { babel } = require('@rollup/plugin-babel');
const alias = require('@rollup/plugin-alias');
const resolve = require('@rollup/plugin-node-resolve');
const replace = require('rollup-plugin-replace');
// const typescript = require('@rollup/plugin-typescript');
const typescript = require('rollup-plugin-typescript2');
const common = require('@rollup/plugin-commonjs');
const jsx = require('rollup-plugin-jsx');
const less = require('rollup-plugin-less');
const { uglify } = require('rollup-plugin-uglify');
const analyze = require('rollup-plugin-analyzer');

const getProjectPath = (paths) => path.join(__dirname, '../', paths);
const varsPath = getProjectPath('./src/components/style/index.less');

function mkdirPath(pathStr) {
  let projectPath = '/';
  const pathArr = pathStr.split('/');
  for (let i = 0; i < pathArr.length; i++) {
    projectPath += (i === 0 || i === 1 ? '' : '/') + pathArr[i];
    if (!fs.existsSync(projectPath)) {
      if (
        projectPath.indexOf('ti-component/dist') >= 0 &&
                !fs.existsSync(projectPath)
      ) {
        fs.mkdirSync(projectPath);
      }
    }
  }
  return projectPath;
}

// 是否是浏览器中运行的脚本
function isBrowserScriptFormat(dir) {
  return dir.indexOf('umd') >= 0;
}

// 是否是导出样式的脚本文件
function isStyleScript(path) {
  return (
    path.match(/(\/|\\)style(\/|\\)index\.ts/) ||
        path.match(/(\/|\\)style(\/|\\)index\.tsx/) ||
        path.match(/(\/|\\)style(\/|\\)index\.js/) ||
        path.match(/(\/|\\)style(\/|\\)index\.jsx/)
  );
}

// 处理需要直接使用css的情况
function cssInjection(content) {
  return content
    .replace(/\/style\/?'/g, '/style/css\'') // 默认导入index的都转换为导入css
    .replace(/\/style\/?"/g, '/style/css"')
    .replace(/\.less/g, '.css');
}

// 替换导入less脚本中的带有js后缀的字符串
function replaceLessScript(code) {
  if (code.indexOf('.less.js') >= 0) {
    return code.replace(/\.less.js/g, '.less');
  }
  return code;
}

// 创建导入css的脚本名为css.js
function createCssJs(code, filePath, dir, format) {
  if (isBrowserScriptFormat(format)) return;
  const icode = replaceLessScript(code);
  const content = cssInjection(icode);
  const cssDir = filePath
    .replace(/^.*?src\//, `${dir }/`)
    .replace(/index\.ts$|index\.tsx$/, '');
  const styleJsDir = filePath
    .replace(/^.*?src\//, `${dir }/`)
    .replace(/index\.ts$|index\.tsx$/, '');
  const cssJsPath = filePath
    .replace(/^.*?src\//, `${dir }/`)
    .replace(/index\.ts$|index\.tsx$/, 'css.js');
  const styleJsPath = filePath
    .replace(/^.*?src\//, `${dir }/`)
    .replace(/index\.ts$|index\.tsx$/, 'index.js');
  mkdirPath(cssDir);
  mkdirPath(styleJsDir);
  fs.writeFile(cssJsPath, content, function(err) {
    if (err) {
      console.log('--------->write file err', err);
    }
  });
  fs.writeFile(styleJsPath, icode, function(err) {
    if (err) {
      console.log('--------->write file err', err);
    }
  });
}

/**
 *@desc: 获取rollup 输入打包配置
 *@Date: 2021-02-18 10:43:08
 *@param {Object} inputOptionOverride 覆盖input配置
 *@param {Array} additionalPlugins 新增的插件
 *@param {object} tsConfig
 *@return {void}
 */
function getRollUpInputOption(
  inputOptionOverride = {},
  tsConfig = {},
  additionalPlugins = [],
) {
  const external = ['react', 'react-dom'];
  const babelOptions = {
    exclude: ['**/node_modules/**'],
    babelHelpers: 'bundled',
    presets: [
      // "stage-3",
      '@babel/preset-env',
      '@babel/preset-react',
      '@babel/preset-flow',
    ],
    extensions: ['tsx', 'ts', 'js', 'jsx'],
    plugins: [
      '@babel/transform-react-jsx',
      // ['@babel/plugin-transform-runtime', { useESModules: true }],
      [
        '@babel/plugin-proposal-class-properties',
        {
          loose: true,
        },
      ],
      [
        '@babel/plugin-proposal-decorators',
        {
          legacy: true,
        },
      ],
    ],
  };
  const onAnalysis = ({ bundleSize }) => {
    console.log(`Bundle size bytes: ${bundleSize} bytes`);
    return;
  };
  const inputOptions = {
    external,
    plugins: [
      common(),
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.less'],
      }),
      //   alias({
      //     entries: [
      //       {
      //         find: '@',
      //         replacement: path.resolve('./src'),
      //       },
      //       {
      //         find: '~@',
      //         replacement: path.resolve('./src'),
      //       },
      //     ],
      //   }),
      replace({
        stylePre: JSON.stringify('ti'),
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      less({
        option: {
          globalVars: {
            'theme-color': '#136BDE',
            hack: `true; @import "${varsPath}"`,
          },
        },
        output: false,
      }),
      typescript({
        check: false,
        clean: true,
        tsconfigDefaults: {
          //   include: ['./src/**/*.ts', './src/**/*.tsx'],
          compilerOptions: {
            lib: ['es5', 'es6', 'dom'],
            exclude: ['./src/**/style/*.ts'],
            target: 'ES6',
            // typeRoots: ["./types"],
            moduleResolution: 'node',
            module: 'ES6',
            jsx: 'react',
            allowSyntheticDefaultImports: false,
            ...tsConfig,
          },
        },
      }),
      babel(babelOptions),

      jsx({
        factory: 'React.createElement',
        extensions: ['js', 'jsx', 'tsx'],
      }),
      analyze({ onAnalysis, skipFormatted: true, stdout: true }),
      ...additionalPlugins,
    ],
    ...inputOptionOverride,
  };
  return inputOptions;
}

// 编译生成babel-import-plugin使用的样式脚本
exports.styleScriptBuild = async function(files, outputConf) {
  const outputOptions = [
    {
      // file: outputPath,
      format: 'cjs',
      dir: outputConf.cjs,
      preserveModulesRoot: 'src',
      preserveModules: true,
      exports: 'named',
      hoistTransitiveImports: false, // 不导入其他模块代码
    },
    {
      // file: outputPath,
      format: 'esm',
      dir: outputConf.es,
      preserveModulesRoot: 'src',
      preserveModules: true,
      exports: 'named',
      hoistTransitiveImports: false, // 不导入其他模块代码
    },
  ];
  const bundle = await rollup.rollup(
    getRollUpInputOption(
      {
        input: files,
        treeshake: false,
      },
      {
        declaration: true,
      },
    ),
  );
  for (const outputOption of outputOptions) {
    const { output } = await bundle.generate(outputOption);
    for (const chunkOrAsset of output) {
      if (chunkOrAsset.type === 'chunk') {
        if (isStyleScript(chunkOrAsset.fileName)) {
          createCssJs(
            chunkOrAsset.code,
            chunkOrAsset.facadeModuleId,
            outputOption.dir,
            outputOption.format,
          );
        }
      }
    }
  }
  await bundle.close();
};

// 组件es cjs规范编译输出
exports.buildScript = async function(inputPaths, outputConf) {
  // 输出格式
  const outputOptions = [
    {
      // file: outputPath,
      format: 'cjs',
      dir: outputConf.cjs,
      preserveModulesRoot: 'src',
      preserveModules: true,
      exports: 'named',
      hoistTransitiveImports: false, // 不导入其他模块代码
    },
    {
      // file: outputPath,
      format: 'esm',
      dir: outputConf.es,
      preserveModulesRoot: 'src',
      preserveModules: true,
      exports: 'named',
      hoistTransitiveImports: false, // 不导入其他模块代码
    },
  ];
  for (const outputOption of outputOptions) {
    const bundle = await rollup.rollup(
      getRollUpInputOption(
        {
          input: inputPaths,
          treeshake: true,
        },
        {
          declaration: true,
        },
      ),
    );
    await bundle.generate(outputOption);
    await bundle.write(outputOption);
    await bundle.close();
  }
};

// 打包成一个文件
exports.buildBrowser = async function(entryPath, outputDir, cb) {
  const outputOption = {
    file: `${outputDir }/index.js`,
    format: 'umd',
    // dir: outputDir, preserveModulesRoot: 'src', preserveModules: true,
    name: 'ti',
    exports: 'named',
    globals: {
      react: 'React', // 单个 打包需要暴露的全局变量
      'react-dom': 'ReactDOM',
    },
  };
  const bundle = await rollup.rollup(
    getRollUpInputOption(
      {
        input: entryPath,
        treeshake: true,
      },
      {},
      [uglify()],
    ),
  );
  await bundle.generate(outputOption);
  await bundle.write(outputOption);
  await bundle.close();
  cb();
};
