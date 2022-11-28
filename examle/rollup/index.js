const path = require('path');
const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');
const resolve = require('@rollup/plugin-node-resolve');
const jsx = require('rollup-plugin-jsx');
const less = require('rollup-plugin-less');
const postcss = require('rollup-plugin-postcss');
const task = async({ input, output, format }) => {
  const bundle = await rollup({
    input: input,
    plugins: [
      commonjs(),
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.less'],
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
      }),
      //   less({
      //     option: {
      // globalVars: {
      //   'theme-color': '#136BDE',
      // },
      //     },
      //     output: true,
      //   }),
      typescript({
        check: false,
        tsconfig: path.join(__dirname, './tsconfig.json'),
        cacheRoot: path.join(__dirname, './node_modules/.rts2_cache'),
        clean: true,
      }),
      jsx({
        factory: 'React.createElement',
        extensions: ['js', 'jsx', 'tsx'],
      }),
    ],
    external: [
      'react',
      'react-dom',
    ],
  });


  await bundle.write({
    format: format,
    file: path.join(__dirname, '/dist/es/index.js'),
    // dir: path.join(__dirname, '/dist/es'),
    // preserveModulesRoot: 'src',
    // preserveModules: true,
    // exports: 'named',
    // hoistTransitiveImports: false,
  });
//   await bundle.write({
//     format: 'amd',
//     file: path.join(__dirname, '/dist/lib/index.js'),
//     name: 'ti',
//     exports: 'named',
//     globals: {
//       react: 'React', // 单个 打包需要暴露的全局变量
//       'react-dom': 'ReactDOM',
//     },
//   });
};

const tasks = {
  input: path.join(__dirname, '/src/index.ts'),
  output: path.join(__dirname, '/dist/es/index.js'),
  format: 'es',
};

task(tasks);
