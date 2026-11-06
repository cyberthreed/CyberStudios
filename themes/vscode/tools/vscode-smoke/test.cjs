const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const jsonc = require('jsonc-parser');

exports.run = async () => {
  const root = path.resolve(__dirname, '../..');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'themes.catalog.json'), 'utf8'));
  const results = [];
  for (const t of catalog) {
    const id = `cyberthreed.cyberstudios-${t.slug}`;
    const extension = vscode.extensions.getExtension(id);
    assert(extension, 'Packaged extension not loaded: ' + id);
    const theme = JSON.parse(fs.readFileSync(path.join(extension.extensionPath, extension.packageJSON.contributes.themes[0].path), 'utf8'));
    await vscode.workspace.getConfiguration('workbench').update('colorTheme', t.name, vscode.ConfigurationTarget.Global);
    // Theme application is asynchronous. Wait for the exporter to reflect the expected editor background.
    let exported;
    for (let attempt=0; attempt<15; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      await vscode.commands.executeCommand('workbench.action.generateColorTheme');
      const doc = vscode.window.activeTextEditor?.document;
      exported = jsonc.parse(doc?.getText() || '{}');
      await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
      if (exported.colors?.['editor.background']?.toUpperCase() === theme.colors['editor.background'].toUpperCase()) break;
    }
    assert(exported?.colors, 'Theme export not available');
    fs.writeFileSync(path.join(root, 'validation', t.slug + '-resolved.json'), JSON.stringify(exported, null, 2));
    assert.equal(vscode.window.activeColorTheme.kind, t.type === 'dark' ? vscode.ColorThemeKind.Dark : vscode.ColorThemeKind.Light);
    const missing = Object.keys(theme.colors).filter(key => !(key in exported.colors));
    assert.equal(missing.length, 0, `Unregistered or unapplied color IDs: ${missing.join(', ')}`);
    for (const [key, value] of Object.entries(theme.colors)) {
      assert.equal(exported.colors[key].toUpperCase(), value.toUpperCase(), `${t.name}: resolved ${key}`);
    }
    const document = await vscode.workspace.openTextDocument(path.join(root, t.folder, 'samples/studio.ts'));
    await vscode.window.showTextDocument(document, {preview:false});
    assert.equal(document.languageId, 'typescript');
    const diagnostics = vscode.languages.getDiagnostics(vscode.Uri.file(path.join(extension.extensionPath, extension.packageJSON.contributes.themes[0].path)));
    assert.equal(diagnostics.filter(d=>d.severity===vscode.DiagnosticSeverity.Error).length, 0);
    fs.writeFileSync(path.join(root, 'validation', t.slug + '-resolved.json'), JSON.stringify(exported, null, 2));
    results.push({name:t.name, extensionId:id, version:vscode.version, resolvedColors:Object.keys(theme.colors).length, kind:vscode.window.activeColorTheme.kind, loaded:true});
    fs.writeFileSync(path.join(root, 'validation/vscode-load.json'), JSON.stringify(results, null, 2)+'\n');
    console.log('THEME_OK ' + t.name);
  }
};
