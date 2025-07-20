const tsConfigPaths = require('tsconfig-paths');
const { compilerOptions } = require('./tsconfig.json');

tsConfigPaths.register({
  baseUrl: './src',
  paths: compilerOptions.paths
}); 