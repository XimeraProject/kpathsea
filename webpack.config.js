const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'kpathsea.js',
    library: 'Kpathsea',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  externals: [
    'semver'
  ]
};
