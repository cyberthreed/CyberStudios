import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {Registry, parseRawGrammar, INITIAL} = require('vscode-textmate');
const {loadWASM, OnigScanner, OnigString} = require('vscode-oniguruma');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const install = process.env.VSCODE_INSTALL || path.join(process.env.LOCALAPPDATA, 'Programs/Microsoft VS Code');
const versionFolder = fs.readdirSync(install).find(folder => fs.existsSync(path.join(install,folder,'resources/app/extensions')));
const extensions = path.join(install,versionFolder,'resources/app/extensions');
const grammars = new Map();
for (const folder of fs.readdirSync(extensions)) {
  const manifestPath = path.join(extensions,folder,'package.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  for (const grammar of manifest.contributes?.grammars || []) {
    grammars.set(grammar.scopeName, path.join(extensions,folder,grammar.path));
  }
}
await loadWASM(fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')).buffer);
const scopes = {
  'studio.ts':'source.ts', 'studio.py':'source.python', 'studio.html':'text.html.basic',
  'studio.css':'source.css', 'studio.json':'source.json', 'studio.yaml':'source.yaml',
  'studio.sql':'source.sql', 'studio.sh':'source.shell', 'studio.md':'text.html.markdown', 'studio.diff':'source.diff'
};
const catalog = JSON.parse(fs.readFileSync(path.join(root,'themes.catalog.json'),'utf8'));
const reports=[];
for (const t of catalog) {
  const theme = JSON.parse(fs.readFileSync(path.join(root,t.folder,`themes/${t.slug}-color-theme.json`),'utf8'));
  const registry = new Registry({
    theme:{name:t.name,settings:theme.tokenColors},
    onigLib:Promise.resolve({createOnigScanner:patterns => new OnigScanner(patterns),createOnigString:s=>new OnigString(s)}),
    loadGrammar:async scope => {
      const file = grammars.get(scope);
      return file ? parseRawGrammar(fs.readFileSync(file,'utf8'),file) : null;
    }
  });
  const report={name:t.name, files:[], assertions:[]};
  const tokenized = new Map();
  for (const [file,scope] of Object.entries(scopes)) {
    const grammar=await registry.loadGrammar(scope);
    assert(grammar, 'Missing bundled grammar ' + scope);
    const lines=fs.readFileSync(path.join(root,t.folder,'samples',file),'utf8').split(/\r?\n/);
    let stack=INITIAL, tokenCount=0;
    const colors=new Set();
    const rows=lines.map(line=>{
      const result=grammar.tokenizeLine2(line,stack);
      stack=result.ruleStack;
      const map=registry.getColorMap(), spans=[];
      for(let i=0;i<result.tokens.length;i+=2) {
        const start=result.tokens[i], end=result.tokens[i+2] ?? line.length;
        const color=map[(result.tokens[i+1]>>>15)&0x1FF];
        spans.push({start,end,text:line.slice(start,end),color});
        colors.add(color); tokenCount++;
      }
      return {line,spans};
    });
    assert(tokenCount>10, 'Grammar did not tokenize '+file);
    assert(colors.size>=3, 'Insufficient syntax differentiation '+file);
    tokenized.set(file,rows);
    report.files.push({file,grammar:scope,tokenCount,distinctColors:colors.size});
  }
  function expect(file,text,role) {
    const row=tokenized.get(file).find(row=>row.line.includes(text));
    assert(row, 'Missing sample text '+text);
    const offset=row.line.indexOf(text);
    const token=row.spans.find(token=>offset>=token.start&&offset<token.end);
    assert.equal(token?.color?.toUpperCase(),t.palette[role].toUpperCase(),`${t.name}: ${file} ${text} should use ${role}`);
    report.assertions.push(`${file}: ${text} → ${role}`);
  }
  expect('studio.ts','// dream','comment');
  expect('studio.ts','export','keyword');
  expect('studio.ts','CyberStudios','string');
  expect('studio.ts','88','number');
  expect('studio.ts','welcome','function');
  expect('studio.ts','Companion','type');
  expect('studio.json','studio','property');
  expect('studio.json','CyberStudios','string');
  expect('studio.html','main','keyword');
  expect('studio.css','max-width','property');
  reports.push(report);
  registry.dispose();
  console.log(`${t.name}: 10 language samples tokenized; ${report.assertions.length} syntax color assertions passed`);
}
fs.writeFileSync(path.join(root,'validation/syntax.json'),JSON.stringify(reports,null,2)+'\n');
