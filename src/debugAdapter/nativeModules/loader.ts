import * as path from 'path';

const nativeModules = [
  {
    jsPath: '/scrypt.js/js.js',
    nodePath: '/scrypt.js/node.js',
  },
  {
    jsPath: '/web3-eth-accounts/node_modules/scrypt.js/js.js',
    nodePath: '/web3-eth-accounts/node_modules/scrypt.js/node.js',
  },
];

// Override .node implementation by pure js implementation
// IMPORTANT:
// it doesn't work in 100% of cases and may stop working in future versions of node (this is not public api)
function overrideNativeModule(_module: { jsPath: string, nodePath: string }) {
  try {
    const absolutePathToNodeModule = path.join(__dirname, '../../../../node_modules' + _module.nodePath);
    const absolutePathToJsModule = path.join(__dirname, '../../../../node_modules' + _module.jsPath);

    require('module')._cache[absolutePathToNodeModule] = require(absolutePathToJsModule);
  } catch (e) {
    // ignore since there may be no files in node_modules
  }
}

export default function overrideNativeModules() {
  // IS_BUNDLE_TIME is initialized in webpack.config
  // skip this process when bundle time goes since webpack already overrides by using resolve.alias
  if (typeof(IS_BUNDLE_TIME) === 'undefined') {
    nativeModules.forEach((m) => {
      overrideNativeModule(m);
    });
  }
}
