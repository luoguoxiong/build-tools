import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';
import fs from 'fs-extra';
import { rollup } from 'rollup';
import ts from 'rollup-plugin-typescript2';
import chalk from 'chalk';
import { compress } from 'brotli';
import commonJS from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { getChalkInstance } from './log.mjs';

const require = createRequire(import.meta.url);

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const entry = path.join(__dirname, '../src/index.ts');

const ouputDir = path.join(__dirname, '../dist');

const buildOpts = ['cjs', 'esm'];

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const file = fs.readFileSync(filePath);
  const minSize = `${(file.length / 1024).toFixed(2) }kb`;
  const gzipped = gzipSync(file);
  const gzippedSize = `${(gzipped.length / 1024).toFixed(2) }kb`;
  const compressed = compress(file);
  const compressedSize = `${(compressed?.length / 1024).toFixed(2) }kb`;
  console.log(
    `${chalk.gray(
      chalk.bold(path.basename(filePath))
    )} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
  );
  console.log();
}
const { devDependencies, dependencies, peerDependencies } = require('../package.json');

async function run(){
  fs.removeSync(ouputDir);

  for(const opt of buildOpts){
    const bundle = await rollup({
      input: entry,
      plugins: [
        commonJS(),
        nodeResolve(),
        ts({
          check: false,
          tsconfig: path.join(__dirname, '../tsconfig.json'),
          cacheRoot: path.join(__dirname, './node_modules/.rts2_cache'),
          clean: true,
        }),
        [
          terser({
            compress: {
              ecma: 2015,
              pure_getters: true,
            },
            safari10: true,
          }),
        ],
      ],
      external: [
        ...['path', 'url', 'stream'],
        ... Object.keys(devDependencies || {}),
        ...Object.keys(dependencies || {}),
        ...Object.keys(peerDependencies || {}),
      ],
    });
    const startTime = Date.now();

    const chalkLog = getChalkInstance();

    console.log(chalkLog(`rollup building format: ${opt}`));

    const file = path.join(__dirname, `../dist/index.${opt}.js`);

    await bundle.write({
      format: opt,
      file: file,
    });

    const endTime = Date.now();

    console.log(chalkLog(`rollup building format: ${opt} success use: ${endTime - startTime}ms`));

    checkFileSize(file);
  }
}
run().catch((error) => {
  console.log(error);
});
