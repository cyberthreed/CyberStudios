'use strict';
const { packager } = require('@electron/packager');
packager({
  dir: require('node:path').join(__dirname, '..'),
  name: 'Byte Resident', platform: 'win32', arch: 'x64',
  out: 'dist', overwrite: true, asar: true, prune: true,
  executableName: 'Byte',
  ignore: [/^\/(tests|scripts|test-results|docs|\.vscode)(\/|$)/, /^\/\.git/],
  win32metadata: { CompanyName: 'CyberStudios', FileDescription: 'Byte Resident desktop companion', ProductName: 'Byte Resident' }
}).then(paths => console.log('Portable Windows app:', paths.join('\n'))).catch(error => { console.error(error); process.exitCode = 1; });
