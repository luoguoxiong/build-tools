const path = require('path');
const fs = require('fs');
const swc = require('@swc/core');
swc
  .transform(fs.readFileSync(path.join(__dirname, './src/index.ts')), {
    // Some options cannot be specified in .swcrc
    filename: 'input.js',
    sourceMaps: true,
    // Input files are treated as module by default.
    isModule: false,

    // All options below can be configured via .swcrc
    jsc: {
      parser: {
        syntax: 'ecmascript',
      },
      transform: {},
    },
  })
  .then((output) => {
    // output.code; // transformed code
    // output.map; // source map (in string)
    console.log(output);
  });
