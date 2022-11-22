const path = require('path');
const fs = require('fs-extra');
const ts = require('rollup-plugin-typescript2');
const rollup = require('rollup');
const chalk = require('chalk');

const getWorkSpaceTargets = ({ workspace = 'packages' }) => {
  const cwd = process.cwd();
  const targetDir = path.join(cwd, workspace);
  const targetPackages = fs.readdirSync(targetDir);
  const targetPackagesPath = targetPackages.map(((item) => path.join(targetDir, item)));
  return targetPackagesPath.filter((dir) => {
    if(!fs.statSync(dir).isDirectory()){
      return false;
    }
    const targetPackagePath = `${dir}/package.json`;
    const isExist = fs.existsSync(targetPackagePath);
    if(isExist){
      const pkg = require(targetPackagePath);
      return pkg.private ? false : true;
    }
    return false;
  });
};

const createConfig = (target) => {

};
const run = () => {
  const conf = require('./build.conf.json');
  let target;
  if(conf.workspaces && Array.isArray(conf.workspaces)){
    target = [].concat(...conf.workspaces.map((item) => getWorkSpaceTargets(item)));
  }else{
    target = [__dirname];
  }
  console.log(target);
};
run();
// const shouldEmitDeclarations = true;

// const shouldSourcemap = false;

// const target = 'babel';

// const pkgDir = path.resolve(__dirname, './packages/babel');


// async function run(){
//   const bundle = await rollup.rollup({
//     input: './packages/babel/src/index.tsx',
//     plugins: [
//       ts({
//         check: false,
//         tsconfig: path.resolve(__dirname, 'tsconfig.json'),
//         cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
//         tsconfigOverride: {
//           compilerOptions: {
//             target: 'es2015',
//             sourceMap: shouldSourcemap,
//             declaration: shouldEmitDeclarations,
//             declarationMap: shouldEmitDeclarations,
//           },
//           exclude: ['**/__tests__', 'test-dts'],
//         },
//       }),
//     ],
//   });

//   await bundle.write({
//     format: 'cjs',
//     file: './packages/babel/dist/index.js',
//   });

//   console.log();
//   console.log(
//     chalk.bold(chalk.yellow(`Rolling up type definitions for ${target}...`))
//   );

//   // build types
//   const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');

//   const extractorConfigPath = path.resolve(pkgDir, 'api-extractor.json');
//   const extractorConfig =
//       ExtractorConfig.loadFileAndPrepare(extractorConfigPath);
//   const extractorResult = Extractor.invoke(extractorConfig, {
//     localBuild: true,
//     showVerboseMessages: true,
//   });

//   if (extractorResult.succeeded) {
//     // concat additional d.ts to rolled-up dts
//     const typesDir = path.resolve(pkgDir, 'types');
//     console.log('typesDir', typesDir);
//     if (await fs.exists(typesDir)) {
//       const dtsPath = path.resolve(pkgDir, pkg.types);
//       const existing = await fs.readFile(dtsPath, 'utf-8');
//       const typeFiles = await fs.readdir(typesDir);
//       const toAdd = await Promise.all(
//         typeFiles.map((file) => fs.readFile(path.resolve(typesDir, file), 'utf-8'))
//       );
//       console.log('toAdd', toAdd);
//       console.log('dtsPath', dtsPath);
//       console.log('existing', existing);
//       await fs.writeFile(dtsPath, `${existing }\n${ toAdd.join('\n')}`);
//     }
//     console.log(
//       chalk.bold(chalk.green('API Extractor completed successfully.'))
//     );
//   } else {
//     console.error(
//       `API Extractor completed with ${extractorResult.errorCount} errors` +
//           ` and ${extractorResult.warningCount} warnings`
//     );
//     process.exitCode = 1;
//   }

//   await fs.remove(`${pkgDir}/dist/packages`);
// }
// run();
