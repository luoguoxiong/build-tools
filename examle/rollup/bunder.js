const path = require('path');
const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');
const resolve = require('@rollup/plugin-node-resolve');
const jsx = require('rollup-plugin-jsx');
const postcss = require('rollup-plugin-postcss');
const terser = require('@rollup/plugin-terser');
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
      postcss({
        extract: format === 'iife' ? cssOutPut : false,
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
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true,
        },
        safari10: true,
      }),
    ],
    external: [
      'react',
      'react-dom',
    ],
  });


  await bundle.write({
    format: format,
    dir: outputDir,
    name: name,
    preserveModules: format !== 'iife',
  });
};


const tasks = [{
  input: path.join(__dirname, '/src/index.ts'),
  outputDir: path.join(__dirname, '/dist/es'),
  format: 'esm',
  name: 'antd',
},
{
  input: path.join(__dirname, '/src/index.ts'),
  outputDir: path.join(__dirname, '/dist/cjs'),
  format: 'cjs',
  name: 'antd',
},
{
  input: path.join(__dirname, '/src/index.ts'),
  outputDir: path.join(__dirname, '/dist/lib'),
  format: 'iife',
  name: 'antd',
},
];

tasks.forEach(async(item) => {
  await task(item);
});
