const path = require('path');
const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');
const resolve = require('@rollup/plugin-node-resolve');
const jsx = require('rollup-plugin-jsx');
const { babel } = require('@rollup/plugin-babel');
const less = require('rollup-plugin-less');
const styles = require('rollup-plugin-styles');
const postcss = require('rollup-plugin-postcss');
const RollPostcssInject2Css = require('rollup-plugin-postcss-inject-to-css');

const task = async({ input, outputDir, format, name = 'index' }) => {
  const cssOutPut = path.join(outputDir, `${name}.css`);
  const jsOutPut = path.join(outputDir, `${name}.js`);

  const bundle = await rollup({
    input: input,
    plugins: [
      commonjs(),
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.less'],
      }),
      //   babel(babelOptions),

      //   RollPostcssInject2Css.default(),
      typescript({
        check: false,
        tsconfig: path.join(__dirname, './tsconfig.json'),
        cacheRoot: path.join(__dirname, './node_modules/.rts2_cache'),
        clean: false,
      }),
      postcss({
        extract: false,
        use: [[
          'less', {
            globalVars: {
              'theme-color': '#136BDE',
            },
          },
        ]],
        extensions: ['.less'],
        plugins: [],
      }),
    ],
    external: [
      'react',
      'react-dom',
    ],
  });


  await bundle.generate({
    format: format,
    // file: jsOutPut,
    dir: outputDir,
    preserveModulesRoot: 'src',
    preserveModules: true,
    exports: 'named',
    hoistTransitiveImports: false, // 不导入其他模块代码
  });

  await bundle.write({
    dir: outputDir,
    format: format,
    preserveModules: true,
  });
};



const tasks = [{
  input: path.join(__dirname, '/src/index.ts'),
  outputDir: path.join(__dirname, '/dist/es'),
  format: 'esm',
  name: 'antd',
}];
tasks.forEach((item) => {
  task(item);
});
