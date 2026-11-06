import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const codeRoot = process.env.VSCODE_INSTALL || path.join(process.env.LOCALAPPDATA, 'Programs/Microsoft VS Code');
const versionFolder = fs.readdirSync(codeRoot).find(folder => fs.existsSync(path.join(codeRoot, folder, 'resources/app/out/cli.js')));
if (!versionFolder) throw new Error('Cannot find the installed VS Code CLI');
const cli = path.join(codeRoot, versionFolder, 'resources/app/out/cli.js');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberstudios-theme-check-'));
const extensionsDir = path.join(scratch, 'extensions');
const profile = path.join(scratch, 'profile');
fs.mkdirSync(path.join(profile, 'User'), {recursive:true});
fs.writeFileSync(path.join(profile, 'User/settings.json'), JSON.stringify({'telemetry.telemetryLevel':'off','update.mode':'none','extensions.autoUpdate':false,'workbench.startupEditor':'none','window.title':'CyberStudios Theme Validation','security.workspace.trust.enabled':false}));
const catalog = JSON.parse(fs.readFileSync(path.join(root,'themes.catalog.json'),'utf8'));
for (const t of catalog) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root,t.folder,'package.json'),'utf8'));
  const vsix = path.join(root,t.folder,'dist',`${manifest.name}-${manifest.version}.vsix`);
  const result = spawnSync(path.join(codeRoot, 'Code.exe'), [cli, '--user-data-dir',profile,'--extensions-dir',extensionsDir,'--install-extension',vsix,'--force'], {encoding:'utf8', env:{...process.env, ELECTRON_RUN_AS_NODE:'1', VSCODE_IPC_HOOK_CLI:''}});
  console.log(result.stdout?.trim());
  if (result.status !== 0) throw new Error(result.stderr || 'VSIX install failed');
}
const env = {...process.env};
delete env.ELECTRON_RUN_AS_NODE; delete env.VSCODE_IPC_HOOK_CLI;
fs.writeFileSync(path.join(root,'validation/isolated-profile.json'), JSON.stringify({scratch, profile, extensionsDir},null,2));
const result = spawnSync(path.join(codeRoot, 'Code.exe'), [
  '--user-data-dir',profile,'--extensions-dir',extensionsDir,
  '--extensionDevelopmentPath=' + path.join(root,'tools/vscode-smoke'),
  '--extensionTestsPath=' + path.join(root,'tools/vscode-smoke/test.cjs'),
  '--skip-welcome','--skip-release-notes','--disable-workspace-trust','--disable-updates',
  path.join(root,'cy afterhours/samples')
], {encoding:'utf8',env,timeout:180000});
console.log(result.stdout);
if (result.status !== 0) { console.error(result.stderr); throw new Error('VS Code integration check failed: ' + result.status); }
console.log('All eight packaged themes loaded in an isolated VS Code profile.');
