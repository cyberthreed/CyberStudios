# ♡ cyberstudios / theme.library ✧

**`dream in pixels. create without limits.`**

☁️　🎀　🖥️　💿　✧

*eight little workspaces for pixels, daydreams & too many open tabs.*

Standalone VS Code color themes with coordinated workbench colors, syntax highlighting, semantic token rules, and terminal palettes. Each labeled folder is a complete, independent theme project. The source is hosted here on GitHub. These themes are not listed on the Visual Studio Marketplace.

Five dark themes. Three light themes. A place for late-night experiments, quiet focus, and whatever you're making next. ♡

**[♡ Cybercore Cotton Candy · Soft & Vivid](cybercore-cotton-candy/)**

## ✧ find your workspace

| Theme | Mode | Palette | Folder |
| --- | --- | --- | --- |
| Cy Afterhours | Dark | Aubergine · orchid · electric lilac | [cy afterhours](cy%20afterhours/) |
| Byte Terminal | Dark | Graphite · cyan · mint | [byte terminal](byte%20terminal/) |
| Aero Lagoon | Light | Glacier blue · pearl · deep teal | [aero lagoon](aero%20lagoon/) |
| Rose Quartz | Light | Warm cream · dusty rose · plum | [rose quartz](rose%20quartz/) |
| Obsidian Forge | Dark | Warm charcoal · bronze · pale steel | [obsidian forge](obsidian%20forge/) |
| Steel Horizon | Dark | Midnight navy · slate · brushed blue | [steel horizon](steel%20horizon/) |
| Timberline | Dark | Forest · olive · brass | [timberline](timberline/) |
| Concrete Day | Light | Stone · graphite · slate blue | [concrete day](concrete%20day/) |

## 💾 bring one to your desktop

[♡ Download the eight-theme installer ZIP](https://github.com/cyberthreed/CyberStudios/releases/download/vscode-themes-v1.0.0/CyberStudios-Themes-Installers-1.0.0.zip) · [Release notes](https://github.com/cyberthreed/CyberStudios/releases/tag/vscode-themes-v1.0.0)

Download the ZIP, extract it, and choose the VSIX for the workspace you want to bring home.

The installers ZIP contains the eight standalone themes. Cybercore Cotton Candy remains a separate Soft & Vivid settings-preset collection.

1. Open VS Code and go to **Extensions**.
2. Choose **… → Install from VSIX…**
3. Select the downloaded `.vsix` file, or the file you built locally in the theme's **dist** folder.
4. Open **Preferences: Color Theme** from the Command Palette and pick the theme by name.

You can install all eight and switch between them with **Ctrl+K, Ctrl+T** (Windows/Linux) or **⌘K, ⌘T** (macOS). VS Code may display an extension trust prompt when you install a locally packaged extension. These packages contribute colors only and have no executable extension entry point.

Requires VS Code 1.100.0 or later. No extra color theme, icon pack, font, or account is required.

## ☁️ inside each little folder

- `themes/` — editable color theme JSON.
- `dist/` — ready-to-install VSIX.
- `package.json` — the extension's name, version, and theme contribution.
- `README.md`, `CHANGELOG.md`, and `LICENSE` — project documentation and MIT license.
- `samples/` — TypeScript, Python, HTML, CSS, JSON, YAML, SQL, shell, Markdown, and diff examples.
- `.vscode/launch.json` — press **F5** to preview the theme in an Extension Development Host.
- `scripts/package.mjs` — rebuild this project's VSIX with `npm run package`.

## 🎀 make it yours

To edit just one theme, change its JSON in `themes/`, then run `npm run package` inside that theme's folder. Node.js 22 or later and an internet connection are needed the first time the pinned packaging tool is downloaded. Reinstall the rebuilt VSIX to update your installed copy.

The root `themes.catalog.json` preserves the eight approved palettes. `tools/build-themes.mjs` generates all eight projects from it. **Running the root `npm run build` overwrites generated theme JSON, project READMEs, manifests, and sample files.** For hand edits, work directly in one theme folder and use its package command. If you want to regenerate the whole collection, put shared changes in the generator first.

Collection commands, from this folder:

```sh
npm ci --ignore-scripts
npm run build
npm run check
npm run package
```

The root tools are for maintaining the collection; individual theme folders do not depend on them to install or package.

To refresh the generated READMEs and changelogs while preserving hand-edited theme colors, run `npm run docs`. Then rebuild the installers and bundles to keep the downloadable copies in step with the source.

## 💿 when you're ready to share

The collection lives in this repository under `themes/vscode/`. The theme READMEs are ready to use. Build output is intentionally ignored by Git; add a theme's VSIX as a GitHub Release attachment when you want to share an installable copy. The local ZIP bundles also contain ready-to-install copies.

The manifests use `cyberthreed` as their local publisher namespace. A Marketplace listing would require a registered publisher with that ID or an updated manifest. The source folders and [v1.0.0 installer release](https://github.com/cyberthreed/CyberStudios/releases/tag/vscode-themes-v1.0.0) are published. These themes are not listed on the Visual Studio Marketplace.

## ✧ checked, with a few little notes

See [VALIDATION.md](VALIDATION.md) for checks performed and their limits. Fonts, file icons, interface layout, and extension webviews depend on your VS Code setup. Custom color overrides, language extensions, and OS high-contrast settings can affect appearance.

Microsoft's reference: [Color themes](https://code.visualstudio.com/api/extension-guides/color-theme), [semantic highlighting](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide), and [packaging VSIX extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

Made by [CyberStudios](https://github.com/cyberthreed/CyberStudios).

*somewhere between a daydream and a computer screen.* ♡
