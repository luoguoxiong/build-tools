import path, { resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const entry = path.join(__dirname, '../src/index.ts');

const { devDependencies, dependencies, peerDependencies } = require('../package.json');

const buildOpts = ['cjs', 'esm'];

const nativeNodeModulesPlugin = {
  name: 'native-node-modules',
  setup(build) {
    // If a ".node" file is imported within a module in the "file" namespace, resolve
    // it to an absolute path and put it into the "node-file" virtual namespace.
    build.onResolve({ filter: /\.node$/, namespace: 'file' }, (args) => ({
      path: require.resolve(args.path, { paths: [args.resolveDir] }),
      namespace: 'node-file',
    }));

    // Files in the "node-file" virtual namespace call "require()" on the
    // path from esbuild of the ".node" file in the output directory.
    build.onLoad({ filter: /.*/, namespace: 'node-file' }, (args) => ({
      contents: `
          import path from ${JSON.stringify(args.path)}
          try { module.exports = require(path) }
          catch {}
        `,
    }));

    // If a ".node" file is imported within a module in the "node-file" namespace, put
    // it in the "file" namespace where esbuild's default loading behavior will handle
    // it. It is already an absolute path since we resolved it to one above.
    build.onResolve({ filter: /\.node$/, namespace: 'node-file' }, (args) => ({
      path: args.path,
      namespace: 'file',
    }));

    // Tell esbuild's default loading behavior to use the "file" loader for
    // these ".node" files.
    const opts = build.initialOptions;
    opts.loader = opts.loader || {};
    opts.loader['.node'] = 'file';
  },
};
for(const opt of buildOpts){
  build({
    entryPoints: [entry],
    outfile: path.join(__dirname, `../dist/index.${opt}.js`),
    bundle: true,
    tsconfig: path.resolve(__dirname, '../tsconfig.json'),
    external: [
      ...['path', 'url', 'stream'],
      ... Object.keys(devDependencies || {}),
      ...Object.keys(dependencies || {}),
      ...Object.keys(peerDependencies || {}),
    ],
    sourcemap: true,
    format: opt,
    platform: 'node',
    plugins: [
      nativeNodeModulesPlugin,
      NodeModulesPolyfillPlugin(),
    ],
    watch: {
      onRebuild(error) {
        if (!error) console.log(`rebuilt: ${path.join(__dirname, `../dist/index.${opt}.js`)}`);
      },
    },
  }).then(() => {
    console.log(`watching: ${entry}`);
  });
}


