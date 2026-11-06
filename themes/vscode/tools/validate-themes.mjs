import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { contrast } from './color-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'themes.catalog.json'), 'utf8'));
const docs = new Set(JSON.parse(fs.readFileSync(path.join(root, 'tools/theme-color-ids.json'), 'utf8')));
// These base IDs do not contain dots and are excluded by the documentation extractor.
const base = ['foreground','descriptionForeground','disabledForeground','errorForeground','focusBorder','contrastActiveBorder'];
base.forEach(id => docs.add(id));
const reports = [];
for (const entry of catalog) {
  const dir = path.join(root, entry.folder);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(manifest.contributes.themes.length, 1);
  assert.equal(manifest.contributes.themes[0].label, entry.name);
  assert.equal(manifest.contributes.themes[0].uiTheme, entry.type === 'dark' ? 'vs-dark' : 'vs');
  assert.equal(manifest.main, undefined, 'Themes must not ship executable extension code');
  assert.equal(manifest.dependencies, undefined);
  const theme = JSON.parse(fs.readFileSync(path.join(dir, manifest.contributes.themes[0].path), 'utf8'));
  assert.equal(theme.semanticHighlighting, true);
  for (const [key, value] of Object.entries(theme.colors)) {
    assert(docs.has(key), `Unknown workbench color: ${key}`);
    assert(/^#[0-9A-F]{6}([0-9A-F]{2})?$/i.test(value), `Invalid color ${key}: ${value}`);
  }
  const syntax = new Set([theme.colors['editor.foreground']]);
  for (const rule of theme.tokenColors) {
    if (rule.scope) assert(rule.scope.every(x => typeof x === 'string' && x.trim()));
    if (rule.settings.foreground) syntax.add(rule.settings.foreground);
    assert(/^(|italic|bold|underline|strikethrough)$/.test(rule.settings.fontStyle));
  }
  for (const [selector, style] of Object.entries(theme.semanticTokenColors)) {
    assert(/^(\*|[\w]+)(\.[\w]+)*(:[\w]+)?$/.test(selector), `Invalid semantic selector ${selector}`);
    const fg = typeof style === 'string' ? style : style.foreground;
    if (fg) syntax.add(fg);
  }
  const checks = [];
  function check(label, foreground, background, minimum = 4.5) {
    assert(/^#[0-9a-f]{6}$/i.test(foreground), `Opaque foreground required for ${label}`);
    const ratio = contrast(foreground, background);
    checks.push({label, ratio:Number(ratio.toFixed(2))});
    assert(ratio >= minimum, `${entry.name}: ${label} contrast ${ratio.toFixed(2)} < ${minimum}`);
  }
  for (const foreground of syntax) {
    for (const surface of ['editor.background','editor.lineHighlightBackground','editor.selectionBackground']) {
      check(`syntax ${foreground} on ${surface}`, foreground, theme.colors[surface]);
    }
  }
  const pairs = [
    ['sideBar.foreground','sideBar.background'], ['sideBarTitle.foreground','sideBar.background'],
    ['sideBarSectionHeader.foreground','sideBarSectionHeader.background'],
    ['activityBar.foreground','activityBar.background'], ['activityBar.inactiveForeground','activityBar.background'],
    ['activityBarTop.foreground','activityBarTop.background'], ['activityBarTop.inactiveForeground','activityBarTop.background'],
    ['titleBar.activeForeground','titleBar.activeBackground'], ['titleBar.inactiveForeground','titleBar.inactiveBackground'],
    ['tab.activeForeground','tab.activeBackground'], ['tab.inactiveForeground','tab.inactiveBackground'],
    ['statusBar.foreground','statusBar.background'], ['statusBar.debuggingForeground','statusBar.debuggingBackground'],
    ['button.foreground','button.background'], ['button.foreground','button.hoverBackground'],
    ['button.secondaryForeground','button.secondaryBackground'], ['button.secondaryForeground','button.secondaryHoverBackground'],
    ['badge.foreground','badge.background'], ['input.foreground','input.background'],
    ['input.placeholderForeground','input.background'], ['dropdown.foreground','dropdown.background'],
    ['list.activeSelectionForeground','list.activeSelectionBackground'], ['list.activeSelectionIconForeground','list.activeSelectionBackground'],
    ['list.warningForeground','sideBar.background'], ['list.errorForeground','sideBar.background'],
    ['editorLineNumber.foreground','editor.background'], ['editorLineNumber.activeForeground','editor.background'],
    ['editorError.foreground','editor.background'], ['editorWarning.foreground','editor.background'],
    ['editorInfo.foreground','editor.background'], ['terminal.foreground','terminal.background'],
    ['quickInput.foreground','quickInput.background'], ['menu.foreground','menu.background'],
    ['menu.selectionForeground','menu.selectionBackground'], ['notifications.foreground','notifications.background'],
    ['notificationsErrorIcon.foreground','notifications.background'], ['notificationsWarningIcon.foreground','notifications.background'],
    ['panelTitle.inactiveForeground','panel.background'], ['peekViewTitleLabel.foreground','peekViewTitle.background'],
    ['peekViewTitleDescription.foreground','peekViewTitle.background'], ['editorSuggestWidget.foreground','editorSuggestWidget.background'],
    ['editorSuggestWidget.highlightForeground','editorSuggestWidget.selectedBackground'],
    ['statusBarItem.errorForeground','statusBarItem.errorBackground'], ['statusBarItem.warningForeground','statusBarItem.warningBackground']
  ];
  for (const [fg, bg] of pairs) check(fg, theme.colors[fg], theme.colors[bg]);
  const ansi = Object.keys(theme.colors).filter(k => k.startsWith('terminal.ansi'));
  assert.equal(ansi.length, 16);
  ansi.forEach(key => check(key, theme.colors[key], theme.colors['terminal.background']));
  assert.equal(fs.existsSync(path.join(dir, 'LICENSE')), true);
  const report = {name:entry.name, workbenchColors:Object.keys(theme.colors).length, textMateRules:theme.tokenColors.length, semanticRules:Object.keys(theme.semanticTokenColors).length, contrastChecks:checks.length, minimumContrast:Math.min(...checks.map(x=>x.ratio)), lowest:checks.toSorted((a,b)=>a.ratio-b.ratio).slice(0,3)};
  reports.push(report);
  console.log(`${entry.name}: ${checks.length} contrast checks passed (minimum ${report.minimumContrast}:1)`);
}
fs.mkdirSync(path.join(root,'validation'), {recursive:true});
fs.writeFileSync(path.join(root, 'validation/contrast.json'), JSON.stringify(reports, null, 2) + '\n');
