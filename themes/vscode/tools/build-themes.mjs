import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mix, readable, safeSurface } from './color-utils.mjs';
import { brandThemeReadme } from './brand-docs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'themes.catalog.json'), 'utf8'));
const descriptions = {
  'cy-afterhours': ['Orchid light after midnight.', 'Dark aubergine, electric lilac, soft pink keywords, and mint strings. Inspired by Cy and the creative side of CyberStudios.'],
  'byte-terminal': ['A little signal in the dark.', 'Deep graphite with cyan controls, lavender keywords, and mint strings. A terminal-inspired workspace for late-night experiments with Byte.'],
  'aero-lagoon': ['Clear skies. Open tabs.', 'Glacier blue, pearl surfaces, and deep teal accents. An airy light theme with darker syntax colors that stay readable against its pale background.'],
  'rose-quartz': ['A softer place to build.', 'Warm cream, dusty rose, and plum. A light workspace with rose controls, violet functions, and forest-green strings.'],
  'obsidian-forge': ['Built in charcoal. Finished in bronze.', 'Warm charcoal, bronze controls, pale steel functions, and sage strings. A grounded dark theme with warm highlights and regular comments.'],
  'steel-horizon': ['Steady focus. Blue distance.', 'Midnight navy, slate panels, and brushed-blue controls. Cool, restrained syntax with amber numbers and regular comments.'],
  'timberline': ['Find your focus in the green.', 'Deep forest, olive, and muted brass. A dark, earthy workspace with pale green strings, cool functions, and regular comments.'],
  'concrete-day': ['Quiet structure. Room to think.', 'Light stone, graphite, and slate blue. A restrained daylight theme with rust keywords, deep green strings, and regular comments.']
};

function colorsFor(t) {
  const p = t.palette, dark = t.type === 'dark';
  const tokens = ['ink','keyword','function','string','number','type','property','comment'].map(k => p[k]);
  const line = safeSurface(p.editor, p.line, tokens);
  const selection = safeSurface(p.editor, p.selection, tokens, 0.65);
  const softSelection = mix(p.editor, selection, 0.6);
  const accent = readable(p.accent, p.side);
  const error = readable(dark ? '#F2A0A8' : '#A33743', p.editor);
  const warning = readable(dark ? '#E5C18A' : '#805414', p.editor);
  const success = readable(dark ? p.string : '#386247', p.editor);
  const info = readable(p.type, p.editor);
  const subdued = readable(p.muted, p.bar);
  const overlay = (color, alpha) => color + alpha;
  const c = {};
  const set = (keys, color) => keys.split(' ').forEach(k => c[k] = color);
  set('foreground icon.foreground editor.foreground sideBar.foreground panelTitle.activeForeground', p.ink);
  set('descriptionForeground disabledForeground', readable(p.muted, p.editor));
  set('focusBorder progressBar.background sash.hoverBorder', p.accent);
  set('errorForeground', error);
  set('selection.background', selection);
  set('widget.border editorWidget.resizeBorder contrastActiveBorder', p.border);
  set('widget.shadow scrollbar.shadow', dark ? '#00000066' : '#18323D22');
  set('textLink.foreground textLink.activeForeground', readable(p.accent, p.editor));
  set('textBlockQuote.background textCodeBlock.background textPreformat.background', p.line);
  set('textBlockQuote.border textSeparator.foreground', p.border);
  set('textPreformat.foreground', p.string);
  set('button.background badge.background activityBarBadge.background extensionButton.prominentBackground', p.accent);
  set('button.foreground badge.foreground activityBarBadge.foreground extensionButton.prominentForeground', p['accent-ink']);
  set('button.hoverBackground extensionButton.prominentHoverBackground', mix(p.accent, dark ? '#FFFFFF' : '#000000', 0.09));
  set('button.border', overlay(p.accent, '60'));
  set('button.secondaryBackground', p.line);
  set('button.secondaryForeground', readable(p.ink, p.line));
  set('button.secondaryHoverBackground', mix(p.line, p.accent, 0.08));
  set('checkbox.background input.background dropdown.background settings.textInputBackground settings.numberInputBackground settings.dropdownBackground', p.editor);
  set('checkbox.foreground input.foreground dropdown.foreground settings.textInputForeground settings.numberInputForeground settings.dropdownForeground', p.ink);
  set('checkbox.border input.border dropdown.border settings.textInputBorder settings.numberInputBorder settings.dropdownBorder', p.border);
  set('input.placeholderForeground', p.muted);
  set('dropdown.listBackground', p.side);
  set('inputOption.activeBackground', p.line);
  set('inputOption.activeForeground', readable(p.accent, p.line));
  set('inputOption.activeBorder inputOption.hoverBackground', overlay(p.accent, '60'));
  for (const [kind, color] of [['error', error], ['warning', warning], ['info', info]]) {
    set(`inputValidation.${kind}Background`, p.editor);
    set(`inputValidation.${kind}Foreground inputValidation.${kind}Border`, color);
  }
  set('activityBar.background', p.activity);
  set('activityBar.foreground', readable(p.accent, p.activity));
  set('activityBar.inactiveForeground', readable(p.muted, p.activity));
  set('activityBar.border sideBar.border sideBarSectionHeader.border', p.border);
  set('activityBar.activeBorder', p.accent);
  set('activityBar.activeBackground', overlay(p.accent, '10'));
  set('activityBarTop.background', p.bar);
  set('activityBarTop.foreground', readable(p.accent, p.bar));
  set('activityBarTop.inactiveForeground', subdued);
  set('activityBarTop.activeBorder', p.accent);
  set('sideBar.background', p.side);
  set('sideBarTitle.foreground sideBarSectionHeader.foreground', readable(p.ink, p.side));
  set('sideBarSectionHeader.background', p.bar);
  set('sideBar.dropBackground', overlay(p.accent, '18'));
  set('list.activeSelectionBackground list.inactiveSelectionBackground list.hoverBackground list.focusBackground', p.line);
  set('list.activeSelectionForeground list.inactiveSelectionForeground list.focusForeground list.hoverForeground', readable(p.ink, p.line));
  set('list.activeSelectionIconForeground list.highlightForeground list.focusHighlightForeground', readable(p.accent, p.line));
  set('list.focusOutline list.inactiveFocusOutline', p.accent);
  set('list.dropBackground', overlay(p.accent, '20'));
  set('list.errorForeground', readable(error, p.side));
  set('list.warningForeground', readable(warning, p.side));
  set('list.deemphasizedForeground', readable(p.muted, p.side));
  set('tree.indentGuidesStroke tree.inactiveIndentGuidesStroke', p.border);
  set('titleBar.activeBackground statusBar.background statusBar.noFolderBackground', p.bar);
  set('titleBar.inactiveBackground', p.side);
  set('titleBar.activeForeground statusBar.foreground statusBar.noFolderForeground', readable(p.ink, p.bar));
  set('titleBar.inactiveForeground', readable(p.muted, p.side));
  set('titleBar.border statusBar.border statusBar.noFolderBorder statusBar.debuggingBorder', p.border);
  set('statusBar.debuggingBackground statusBarItem.remoteBackground', p.accent);
  set('statusBar.debuggingForeground statusBarItem.remoteForeground', p['accent-ink']);
  set('statusBarItem.hoverBackground statusBarItem.prominentBackground', overlay(p.accent, '16'));
  set('statusBarItem.hoverForeground statusBarItem.prominentForeground', readable(p.ink, p.bar));
  set('statusBarItem.prominentHoverBackground', overlay(p.accent, '25'));
  set('statusBarItem.errorBackground', error);
  set('statusBarItem.errorForeground', readable(p.editor, error));
  set('statusBarItem.warningBackground', warning);
  set('statusBarItem.warningForeground', readable(p.editor, warning));
  set('commandCenter.background', p.editor);
  set('commandCenter.foreground', p.ink);
  set('commandCenter.border', p.border);
  set('commandCenter.activeForeground', p.accent);
  set('editorGroup.border editorGroupHeader.tabsBorder editorGroupHeader.border', p.border);
  set('editorGroupHeader.tabsBackground editorGroupHeader.noTabsBackground tab.inactiveBackground tab.unfocusedInactiveBackground', p.bar);
  set('tab.activeBackground tab.unfocusedActiveBackground', p.editor);
  set('tab.activeForeground', p.ink);
  set('tab.inactiveForeground tab.unfocusedInactiveForeground', subdued);
  set('tab.unfocusedActiveForeground', p.muted);
  set('tab.border', p.border);
  set('tab.activeBorder', p.editor);
  set('tab.activeBorderTop tab.selectedBorderTop', p.accent);
  set('tab.unfocusedActiveBorderTop', p.border);
  set('tab.hoverBackground tab.unfocusedHoverBackground', line);
  set('editor.background', p.editor);
  set('editor.lineHighlightBackground', line);
  set('editor.lineHighlightBorder', '#00000000');
  set('editorCursor.foreground editorMultiCursor.primary.foreground editorMultiCursor.secondary.foreground', p.accent);
  set('editorLineNumber.foreground editorInlayHint.foreground', p.comment);
  set('editorLineNumber.activeForeground', p.accent);
  set('editor.selectionBackground', selection);
  set('editor.selectionForeground', p.ink);
  set('editor.inactiveSelectionBackground', softSelection);
  set('editor.selectionHighlightBackground', overlay(p.accent, '0A'));
  set('editor.selectionHighlightBorder', overlay(p.accent, '70'));
  set('editor.wordHighlightBackground editor.wordHighlightStrongBackground editor.wordHighlightTextBackground', overlay(p.accent, '08'));
  set('editor.wordHighlightBorder editor.wordHighlightStrongBorder editor.wordHighlightTextBorder', overlay(p.accent, '65'));
  set('editor.findMatchBackground editor.findMatchHighlightBackground editor.findRangeHighlightBackground editor.hoverHighlightBackground', overlay(p.accent, '08'));
  set('editor.findMatchBorder', p.accent);
  set('editor.findMatchHighlightBorder', overlay(p.accent, '75'));
  set('editor.rangeHighlightBackground', overlay(p.accent, '08'));
  set('editorLink.activeForeground', p.accent);
  set('editorWhitespace.foreground', overlay(p.muted, '55'));
  set('editorIndentGuide.background1 editorRuler.foreground', p.border);
  set('editorIndentGuide.activeBackground1', overlay(p.accent, '80'));
  set('editorBracketMatch.background', line);
  set('editorBracketMatch.border', p.accent);
  [p.keyword, p.function, p.string, p.number, p.type, p.property].forEach((color, i) => set(`editorBracketHighlight.foreground${i + 1}`, color));
  set('editorBracketHighlight.unexpectedBracket.foreground editorError.foreground', error);
  set('editorWarning.foreground', warning);
  set('editorInfo.foreground', info);
  set('editorHint.foreground', p.comment);
  set('editorGutter.background', p.editor);
  set('editorGutter.addedBackground', success);
  set('editorGutter.modifiedBackground', info);
  set('editorGutter.deletedBackground', error);
  set('editorOverviewRuler.border', p.border);
  set('editorOverviewRuler.addedForeground', overlay(success, 'AA'));
  set('editorOverviewRuler.modifiedForeground', overlay(info, 'AA'));
  set('editorOverviewRuler.deletedForeground editorOverviewRuler.errorForeground', overlay(error, 'AA'));
  set('editorOverviewRuler.warningForeground', overlay(warning, 'AA'));
  set('editorOverviewRuler.infoForeground', overlay(info, 'AA'));
  set('editorInlayHint.background', p.editor);
  set('editorGhostText.foreground editorCodeLens.foreground', p.comment);
  set('editorWidget.background editorHoverWidget.background editorSuggestWidget.background', p.side);
  set('editorWidget.foreground editorHoverWidget.foreground editorSuggestWidget.foreground', readable(p.ink, p.side));
  set('editorWidget.border editorHoverWidget.border editorSuggestWidget.border', p.border);
  set('editorHoverWidget.statusBarBackground', p.bar);
  set('editorSuggestWidget.selectedBackground', p.line);
  set('editorSuggestWidget.selectedForeground', readable(p.ink, p.line));
  set('editorSuggestWidget.highlightForeground editorSuggestWidget.focusHighlightForeground', readable(p.accent, p.line));
  set('editorSuggestWidget.selectedIconForeground', readable(p.accent, p.line));
  set('editorMarkerNavigation.background', p.side);
  set('editorMarkerNavigationError.background', error);
  set('editorMarkerNavigationWarning.background', warning);
  set('editorMarkerNavigationInfo.background', info);
  set('scrollbarSlider.background', overlay(p.muted, '30'));
  set('scrollbarSlider.hoverBackground', overlay(p.muted, '50'));
  set('scrollbarSlider.activeBackground', overlay(p.accent, '65'));
  set('minimap.background', p.editor);
  set('minimap.selectionHighlight', overlay(p.accent, '80'));
  set('minimap.findMatchHighlight', overlay(warning, 'A0'));
  set('minimap.errorHighlight', error);
  set('minimap.warningHighlight', warning);
  set('minimapSlider.background', overlay(p.muted, '20'));
  set('minimapSlider.hoverBackground', overlay(p.muted, '35'));
  set('minimapSlider.activeBackground', overlay(p.accent, '40'));
  set('panel.background terminal.background debugToolBar.background', p.panel);
  set('panel.border panelInput.border debugToolBar.border', p.border);
  set('panelTitle.activeBorder terminal.tab.activeBorder', p.accent);
  set('panelTitle.inactiveForeground', readable(p.muted, p.panel));
  set('terminal.foreground', readable(p.ink, p.panel));
  set('terminal.selectionBackground', overlay(p.accent, '20'));
  set('terminal.selectionForeground', readable(p.ink, mix(p.panel, p.accent, 0.125)));
  set('terminal.inactiveSelectionBackground', overlay(p.accent, '10'));
  set('terminalCursor.foreground', p.accent);
  set('terminalCursor.background', p.panel);
  set('terminal.border', p.border);
  const ansi = {Black:p.comment, Red:error, Green:success, Yellow:warning, Blue:info, Magenta:p.keyword, Cyan:p.function, White:p.ink};
  for (const [name, color] of Object.entries(ansi)) {
    set('terminal.ansi' + name, readable(color, p.panel));
    set('terminal.ansiBright' + name, readable(mix(color, dark ? '#FFFFFF' : '#000000', 0.12), p.panel));
  }
  set('diffEditor.insertedTextBackground', overlay(success, '14'));
  set('diffEditor.removedTextBackground', overlay(error, '14'));
  set('diffEditor.insertedLineBackground diffEditorGutter.insertedLineBackground', overlay(success, '08'));
  set('diffEditor.removedLineBackground diffEditorGutter.removedLineBackground', overlay(error, '08'));
  set('diffEditor.border', p.border);
  set('diffEditor.diagonalFill', overlay(p.border, '80'));
  set('merge.currentHeaderBackground merge.incomingHeaderBackground', overlay(p.accent, '25'));
  set('merge.currentContentBackground merge.incomingContentBackground', overlay(p.accent, '08'));
  set('merge.border', p.border);
  set('gitDecoration.addedResourceForeground gitDecoration.untrackedResourceForeground', readable(success, p.side));
  set('gitDecoration.modifiedResourceForeground', readable(warning, p.side));
  set('gitDecoration.deletedResourceForeground gitDecoration.conflictingResourceForeground', readable(error, p.side));
  set('gitDecoration.ignoredResourceForeground', readable(p.muted, p.side));
  set('gitDecoration.renamedResourceForeground', readable(info, p.side));
  set('debugIcon.breakpointForeground', error);
  set('debugIcon.startForeground testing.iconPassed', success);
  set('debugIcon.pauseForeground testing.iconQueued', warning);
  set('debugIcon.stopForeground testing.iconFailed testing.iconErrored', error);
  set('debugIcon.stepOverForeground debugIcon.stepIntoForeground debugIcon.stepOutForeground', info);
  set('debugExceptionWidget.background', p.side);
  set('debugExceptionWidget.border', error);
  set('editor.stackFrameHighlightBackground editor.focusedStackFrameHighlightBackground', overlay(warning, '0C'));
  set('quickInput.background menu.background notifications.background peekViewResult.background peekViewEditor.background', p.side);
  set('quickInput.foreground menu.foreground notifications.foreground peekViewResult.fileForeground peekViewResult.lineForeground', readable(p.ink, p.side));
  set('quickInputTitle.background notificationCenterHeader.background', p.bar);
  set('menu.border menu.separatorBackground notifications.border notificationToast.border', p.border);
  set('menu.selectionBackground quickInputList.focusBackground', p.line);
  set('menu.selectionForeground quickInputList.focusForeground', readable(p.ink, p.line));
  set('pickerGroup.foreground', readable(p.accent, p.side));
  set('pickerGroup.border', p.border);
  set('notificationsErrorIcon.foreground', readable(error, p.side));
  set('notificationsWarningIcon.foreground', readable(warning, p.side));
  set('notificationsInfoIcon.foreground', readable(info, p.side));
  set('peekView.border', p.accent);
  set('peekViewTitle.background', p.bar);
  set('peekViewTitleLabel.foreground', readable(p.ink, p.bar));
  set('peekViewTitleDescription.foreground', subdued);
  set('peekViewResult.selectionBackground', p.line);
  set('peekViewResult.selectionForeground', readable(p.ink, p.line));
  set('peekViewResult.matchHighlightBackground peekViewEditor.matchHighlightBackground', overlay(p.accent, '10'));
  set('peekViewEditorGutter.background', p.side);
  set('breadcrumb.background', p.editor);
  set('breadcrumb.foreground', p.muted);
  set('breadcrumb.focusForeground breadcrumb.activeSelectionForeground', p.accent);
  set('breadcrumbPicker.background', p.side);
  set('settings.headerForeground', p.ink);
  set('settings.modifiedItemIndicator', p.accent);
  set('settings.focusedRowBackground settings.rowHoverBackground', line);
  set('settings.focusedRowBorder', p.border);
  set('keybindingLabel.background', p.line);
  set('keybindingLabel.foreground', readable(p.ink, p.line));
  set('keybindingLabel.border keybindingLabel.bottomBorder', p.border);
  set('welcomePage.background', p.editor);
  set('welcomePage.tileBackground', p.side);
  set('welcomePage.tileHoverBackground', line);
  set('welcomePage.tileBorder', p.border);
  set('welcomePage.progress.background', p.border);
  set('welcomePage.progress.foreground', p.accent);
  set('notebook.editorBackground notebook.cellEditorBackground', p.editor);
  set('notebook.cellBorderColor notebook.inactiveFocusedCellBorder', p.border);
  set('notebook.focusedCellBorder notebook.selectedCellBorder notebook.focusedEditorBorder', p.accent);
  set('notebook.cellHoverBackground notebook.selectedCellBackground', overlay(p.accent, '05'));
  set('notebook.outputContainerBackgroundColor', p.panel);
  set('notebook.outputContainerBorderColor', p.border);
  set('notebookStatusSuccessIcon.foreground', success);
  set('notebookStatusErrorIcon.foreground', error);
  set('notebookStatusRunningIcon.foreground', p.accent);
  set('charts.foreground', p.ink);
  set('charts.lines', p.border);
  set('charts.red', error); set('charts.green', success); set('charts.yellow', warning);
  set('charts.blue', info); set('charts.purple', p.keyword); set('charts.orange', p.number);
  set('chat.requestBackground', p.side);
  set('chat.requestBorder', p.border);
  set('chat.slashCommandForeground chat.editedFileForeground', readable(p.accent, p.side));
  set('chat.slashCommandBackground', p.line);
  set('inlineChat.background', p.side);
  set('inlineChat.border', p.border);
  return Object.fromEntries(Object.entries(c).sort(([a], [b]) => a.localeCompare(b)));
}

function themeFor(t) {
  const p = t.palette;
  const rule = (name, scope, foreground, fontStyle = '') => ({name, scope:scope.split('|'), settings:{foreground, fontStyle}});
  const tokenColors = [
    {settings:{foreground:p.ink, background:p.editor, fontStyle:''}},
    rule('Comments', 'comment|punctuation.definition.comment', p.comment, t.italicComments ? 'italic' : ''),
    rule('Documentation tags', 'storage.type.class.jsdoc|storage.type.class.python|entity.name.type.instance.jsdoc|keyword.other.documentation', p.type),
    rule('Keywords and declarations', 'keyword|storage.type|storage.modifier', p.keyword),
    rule('Operators', 'keyword.operator|punctuation.accessor|punctuation.separator.key-value', p.keyword),
    rule('Strings', 'string|punctuation.definition.string', p.string),
    rule('Template interpolation punctuation', 'punctuation.definition.template-expression|punctuation.section.embedded', p.keyword),
    rule('Template expressions', 'meta.template.expression', p.ink),
    rule('Escapes and regular expressions', 'constant.character.escape|string.regexp|constant.other.character-class|keyword.operator.quantifier.regexp', p.number),
    rule('Numbers and language constants', 'constant.numeric|constant.language|constant.character|support.constant|variable.other.constant|variable.other.enummember', p.number),
    rule('Functions and methods', 'entity.name.function|support.function|variable.function|meta.function-call entity.name.function|meta.function-call.generic', p.function),
    rule('Types and namespaces', 'entity.name.type|entity.name.class|entity.name.namespace|entity.name.scope-resolution|support.type|support.class|storage.type.primitive|storage.type.built-in', p.type),
    rule('Variables', 'variable|meta.definition.variable.name', p.ink),
    rule('Properties and members', 'variable.other.property|variable.object.property|support.variable.property|support.type.property-name|meta.object-literal.key', p.property),
    rule('Parameters', 'variable.parameter', p.property),
    rule('Built-in variables', 'variable.language|support.variable', p.type),
    rule('Decorators and annotations', 'entity.name.function.decorator|meta.decorator|punctuation.definition.annotation', p.number),
    rule('Punctuation', 'punctuation|meta.brace', p.property),
    rule('HTML and XML tags', 'entity.name.tag', p.keyword),
    rule('Tag punctuation', 'punctuation.definition.tag', p.comment),
    rule('Attributes', 'entity.other.attribute-name', p.type),
    rule('CSS classes and IDs', 'entity.other.attribute-name.class.css|entity.other.attribute-name.id.css|entity.name.tag.css|entity.name.tag.scss', p.function),
    rule('CSS properties', 'support.type.property-name.css|support.type.property-name.scss|support.type.property-name.less', p.property),
    rule('CSS units and values', 'keyword.other.unit|support.constant.property-value|constant.other.color', p.number),
    rule('JSON object keys', 'support.type.property-name.json|support.type.property-name.jsonc', p.property),
    rule('YAML keys', 'entity.name.tag.yaml|meta.mapping.key.yaml string.unquoted.plain.out.yaml', p.property),
    rule('YAML references', 'entity.name.type.anchor.yaml|variable.other.alias.yaml', p.type),
    rule('Shell commands', 'support.function.builtin.shell|entity.name.command.shell', p.function),
    rule('Markdown headings', 'markup.heading|entity.name.section.markdown|punctuation.definition.heading.markdown', p.function, 'bold'),
    rule('Markdown bold', 'markup.bold', p.ink, 'bold'),
    rule('Markdown emphasis', 'markup.italic', p.ink, 'italic'),
    rule('Markdown links', 'markup.underline.link|markup.underline.link.image|constant.other.reference.link', p.type, 'underline'),
    rule('Markdown inline and fenced code', 'markup.inline.raw|markup.raw.block|fenced_code.block.language', p.string),
    rule('Markdown quotes', 'markup.quote', p.comment),
    rule('Markdown lists', 'punctuation.definition.list.begin.markdown', p.keyword),
    rule('Diff additions', 'markup.inserted', p.string),
    rule('Diff removals', 'markup.deleted', colorsFor(t)['editorError.foreground']),
    rule('Diff changes', 'markup.changed|meta.diff.header', p.number),
    rule('Invalid syntax', 'invalid.illegal', colorsFor(t)['editorError.foreground'], 'underline'),
    rule('Deprecated syntax', 'invalid.deprecated', p.comment, 'strikethrough')
  ];
  const semanticTokenColors = {
    namespace:p.type, type:p.type, class:p.type, enum:p.type, interface:p.type, struct:p.type,
    typeParameter:p.type, parameter:p.property, variable:p.ink, property:p.property,
    enumMember:p.number, 'variable.readonly':p.number, 'property.readonly':p.number,
    function:p.function, method:p.function, macro:p.function, decorator:p.number, event:p.function,
    label:p.type, comment:{foreground:p.comment, italic:t.italicComments},
    string:p.string, keyword:p.keyword, number:p.number, regexp:p.number, operator:p.keyword,
    '*.deprecated':{strikethrough:true}, 'variable.defaultLibrary':p.type,
    'function.defaultLibrary':p.function, 'method.defaultLibrary':p.function
  };
  return {$schema:'vscode://schemas/color-theme', name:t.name, type:t.type, semanticHighlighting:true, colors:colorsFor(t), tokenColors, semanticTokenColors};
}

const write = (folder, name, text) => {
  if (process.argv.includes('--docs-only') && !['README.md', 'CHANGELOG.md'].includes(name)) return;
  const destination = path.join(folder, name); fs.mkdirSync(path.dirname(destination), {recursive:true});
  if (name === 'README.md') {
    const theme = catalog.find(entry => path.join(root, entry.folder) === folder);
    if (theme) text = brandThemeReadme(theme, text);
  }
  if (name === 'CHANGELOG.md') text = text.replace('# Changelog', '# 💿 changelog').replace('Initial ', 'Initial local build of ').replace(' release.', '.');
  fs.writeFileSync(destination, text, 'utf8');
};
const json = value => JSON.stringify(value, null, 2) + '\n';
const license = `MIT License

Copyright (c) 2026 cyberthreed / CyberStudios

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const samples = {
  'studio.ts': `// dream in pixels. create without limits.
type Companion = { readonly name: string; energy: number; online?: boolean };

export class Studio {
  private readonly visitors = new Map<string, Companion>();
  constructor(public readonly name = "CyberStudios") {}

  async welcome(companion: Companion): Promise<string> {
    const { name, energy } = companion;
    this.visitors.set(name, companion);
    const mood = energy > 42 ? "ready to create" : "taking a break";
    return \`\${name} is \${mood}. Welcome home.\`;
  }
}

const byte: Companion = { name: "Byte", energy: 88, online: true };
console.log(await new Studio().welcome(byte));
`,
  'studio.py': `"""A small place for ideas to grow."""
from dataclasses import dataclass

@dataclass
class Companion:
    name: str
    energy: int = 88

    def greet(self, studio: str = "CyberStudios") -> str:
        # Strings, types, numbers, comments, and formatted expressions.
        return f"{self.name} is exploring {studio}: {self.energy / 100:.0%} energy"

if __name__ == "__main__":
    print(Companion("Byte").greet())
`,
  'studio.html': `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>CyberStudios</title></head>
<body>
  <!-- A little corner of cyberspace. -->
  <main class="studio" id="home" aria-labelledby="title">
    <h1 id="title">dream in pixels. create without limits.</h1>
    <button type="button" data-companion="byte">Say hello</button>
  </main>
</body>
</html>
`,
  'studio.css': `/* A small, readable palette. */
:root { --studio-accent: #c994ff; --space: 1.25rem; }
.studio { display: grid; gap: var(--space); max-width: 64ch; margin: auto; }
.studio > h1 { color: var(--studio-accent); font-weight: 650; }
button[data-companion="byte"]:focus-visible { outline: 2px solid currentColor; }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
`,
  'studio.json': json({studio:'CyberStudios', tagline:'dream in pixels. create without limits.', companions:['Cy','Byte'], online:true, visitors:42, next:null}),
  'studio.yaml': `# Configuration preview
studio: CyberStudios
tagline: "dream in pixels. create without limits."
defaults: &defaults
  enabled: true
  energy: 88
companion:
  <<: *defaults
  name: Byte
`,
  'studio.sql': `-- A tiny studio archive.
SELECT project.name, COUNT(visit.id) AS total_visits
FROM project
LEFT JOIN visit ON visit.project_id = project.id
WHERE project.published = TRUE AND project.name LIKE '%Byte%'
GROUP BY project.name
ORDER BY total_visits DESC
LIMIT 8;
`,
  'studio.sh': `#!/usr/bin/env bash
# Keep the little experiments organized.
set -euo pipefail
studio="CyberStudios"
for project in "Byte" "Cy"; do
  printf '%s welcomes %s\\n' "$studio" "$project"
done
`,
  'studio.md': `# CyberStudios

> dream in pixels. create without limits.

Build something **curious**, keep it *playful*, and give it a place to live.

- A companion named \`Byte\`
- A new idea waiting for its first commit

[Explore the studio](https://github.com/cyberthreed)

\`\`\`typescript
const studio = { name: "CyberStudios", open: true };
\`\`\`
`,
  'studio.diff': `diff --git a/studio.ts b/studio.ts
--- a/studio.ts
+++ b/studio.ts
@@ -1,2 +1,2 @@
-const energy = 42;
+const energy = 88;
 const studio = "CyberStudios";
`
};

for (const t of catalog) {
  const dir = path.join(root, t.folder);
  if (!fs.statSync(dir).isDirectory()) throw new Error('Expected labeled folder: ' + dir);
  const packageName = 'cyberstudios-' + t.slug;
  const themeFile = `themes/${t.slug}-color-theme.json`;
  const vsix = `${packageName}-1.0.0.vsix`;
  const [headline, description] = descriptions[t.slug];
  const manifest = {
    name:packageName, displayName:`${t.name} · CyberStudios`, description,
    version:'1.0.0', publisher:'cyberthreed', license:'MIT',
    engines:{vscode:'^1.100.0'}, categories:['Themes'], keywords:['theme','CyberStudios',t.type,t.slug],
    homepage:'https://github.com/cyberthreed/CyberStudios/tree/main/themes/vscode/' + encodeURIComponent(t.folder),
    repository:{type:'git',url:'https://github.com/cyberthreed/CyberStudios.git',directory:'themes/vscode/' + t.folder},
    galleryBanner:{color:t.palette.editor, theme:t.type},
    contributes:{themes:[{id:t.name, label:t.name, uiTheme:t.type === 'dark' ? 'vs-dark' : 'vs', path:'./' + themeFile}]},
    scripts:{package:`node scripts/package.mjs`}
  };
  write(dir, 'package.json', json(manifest));
  write(dir, themeFile, json(themeFor(t)));
  write(dir, 'LICENSE', license);
  write(dir, 'CHANGELOG.md', `# Changelog\n\n## 1.0.0 — 2026-11-06\n\n- Initial ${t.name} release.\n- Workbench colors, TextMate rules, semantic highlighting, and all 16 terminal ANSI colors.\n- Matching editor, terminal, diagnostics, source-control, diff, and notebook surfaces.\n`);
  write(dir, '.gitignore', 'node_modules/\ndist/\n*.vsix\n.DS_Store\nThumbs.db\n');
  write(dir, '.vscodeignore', '.vscode/**\nsamples/**\nscripts/**\nimages/**\ndist/**\nnode_modules/**\n.gitignore\n.vscodeignore\n*.vsix\npackage-lock.json\n');
  write(dir, '.vscode/launch.json', json({version:'0.2.0', configurations:[{name:`Preview ${t.name}`, type:'extensionHost', request:'launch', args:['--extensionDevelopmentPath=${workspaceFolder}', '${workspaceFolder}/samples']}]}));
  write(dir, 'scripts/package.mjs', `import fs from 'node:fs';\nimport {spawnSync} from 'node:child_process';\nfs.mkdirSync('dist', {recursive:true});\nconst args = ['--yes', '@vscode/vsce@4.1.0', 'package', '--no-dependencies', '--allow-missing-repository', '--out', 'dist/${vsix}'];\nconst result = process.platform === 'win32'\n  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx ' + args.join(' ')], {stdio:'inherit'})\n  : spawnSync('npx', args, {stdio:'inherit'});\nprocess.exit(result.status ?? 1);\n`);
  for (const [file, content] of Object.entries(samples)) write(dir, 'samples/' + file, content);
  const swatches = ['editor','side','accent','keyword','function','string','number','type'].map(key => `| ${key} | \`${t.palette[key]}\` |`).join('\n');
  write(dir, 'README.md', `# ${t.name}\n\n**${headline}**\n\n${description}\n\nA standalone ${t.type} color theme for Visual Studio Code, made by CyberStudios.\n\n> dream in pixels. create without limits.\n\n## Install\n\n1. Open the **Extensions** view in VS Code.\n2. Open its **…** menu and choose **Install from VSIX…**\n3. Choose \`dist/${vsix}\` from this project.\n4. Open **Preferences: Color Theme** from the Command Palette and select **${t.name}**.\n\nUse **Ctrl+K, Ctrl+T** on Windows/Linux or **⌘K, ⌘T** on macOS to open the theme picker. Requires VS Code 1.100.0 or later. If you downloaded source without a VSIX, follow the packaging step below first.\n\n## Inside the theme\n\n- Matching tabs, sidebar, activity bar, status bar, menus, inputs, and notifications.\n- TextMate syntax rules plus semantic highlighting for language services that provide it.\n- All 16 ANSI terminal colors, diff colors, Git decorations, debugger controls, and notebook surfaces.\n- ${t.italicComments ? 'Italic' : 'Regular'} comments, distinct syntax colors, and subtle selections.\n- No runtime extension code, network requests, telemetry, extra theme dependencies, or font requirements.\n\n| Palette role | Color |\n| --- | --- |\n${swatches}\n\n## Make it yours\n\nEdit \`${themeFile}\` to change the theme itself. \`colors\` controls the VS Code interface; \`tokenColors\` and \`semanticTokenColors\` control syntax. Selection and current-line backgrounds are tuned for readable contrast.\n\nFor a live development preview, open this folder in VS Code and press **F5**. In the Extension Development Host, select **${t.name}** and open files from \`samples/\`. If you have a custom F5 shortcut, run **Debug: Start Debugging** instead. The development window uses your editor configuration; the theme does not overwrite it.\n\nPrefer a personal override? Add this to your existing VS Code settings:\n\n\`\`\`jsonc\n"editor.tokenColorCustomizations": {\n  "[${t.name}]": {\n    "textMateRules": [\n      { "scope": "comment", "settings": { "fontStyle": "" } }\n    ]\n  }\n},\n"editor.semanticTokenColorCustomizations": {\n  "[${t.name}]": {\n    "rules": { "comment": { "italic": false } }\n  }\n}\n\`\`\`\n\nMerge these keys with any existing customizations rather than replacing your settings file.\n\n## Package locally\n\nWith Node.js 22 or later installed, open a terminal in this folder and run:\n\n\`\`\`sh\nnpm run package\n\`\`\`\n\nThis downloads Microsoft's pinned \`@vscode/vsce\` packager if needed and writes an installable VSIX to \`dist/\`. It does not publish anything. The folder can be used as its own GitHub repository whenever you are ready. \`dist/\` is ignored by Git; attach the VSIX to a GitHub Release if you want to distribute a built copy.\n\nThe manifest uses \`cyberthreed\` as the local publisher namespace. Marketplace publishing would require a matching registered publisher or a manifest change; no Marketplace registration or listing is implied. Set the repository URL after you create your repository.\n\n## Preview notes\n\nColor themes style the editor's colors and syntax. Fonts, file icons, window layout, and custom extension webviews follow your VS Code setup. Language extensions can add their own semantic tokens; use **Developer: Inspect Editor Tokens and Scopes** when tuning a language. Personal color overrides and OS high-contrast settings can change the result.\n\n## License\n\nMIT. Made by [CyberStudios](https://github.com/cyberthreed).\n`);
  console.log(`Built ${t.name}: ${Object.keys(themeFor(t).colors).length} workbench colors`);
}
