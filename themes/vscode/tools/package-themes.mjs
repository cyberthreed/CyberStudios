import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'themes.catalog.json'), 'utf8'));
const vsce = path.join(root, 'node_modules/@vscode/vsce/vsce');
for (const t of catalog) {
  const dir = path.join(root, t.folder);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
  const result = spawnSync(process.execPath, [vsce, 'package', '--no-dependencies', '--allow-missing-repository', '--out', `dist/${pkg.name}-${pkg.version}.vsix`], {cwd:dir, stdio:'inherit'});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
