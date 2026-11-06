import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
fs.mkdirSync('dist', {recursive:true});
const args = ['--yes', '@vscode/vsce@4.1.0', 'package', '--no-dependencies', '--allow-missing-repository', '--out', 'dist/cyberstudios-aero-lagoon-1.0.0.vsix'];
const result = process.platform === 'win32'
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx ' + args.join(' ')], {stdio:'inherit'})
  : spawnSync('npx', args, {stdio:'inherit'});
process.exit(result.status ?? 1);
