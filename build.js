const path = require('path');
const ts = require('rollup-plugin-typescript2');
const rollup = require('rollup');

const shouldEmitDeclarations = true;

const shouldSourcemap = false;

async function run(){
  const bundle = await rollup.rollup({
    input: './packages/babel/src/index.tsx',
    plugins: [
      ts({
        check: false,
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
        tsconfigOverride: {
          compilerOptions: {
            target: 'es2015',
            sourceMap: shouldSourcemap,
            declaration: shouldEmitDeclarations,
            declarationMap: shouldEmitDeclarations,
          },
          exclude: ['**/__tests__', 'test-dts'],
        },
      }),
    ],
  });

  await bundle.write({
    format: 'cjs',
    file: './packages/babel/dist/index.js',
  });
}
run();
