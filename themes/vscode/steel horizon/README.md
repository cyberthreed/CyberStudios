# ♡ steel horizon ✧

**`cyberstudios / theme.library / steel-horizon`**

**Steady focus. Blue distance.**

Midnight navy, slate panels, and brushed-blue controls. Cool, restrained syntax with amber numbers and regular comments.

A standalone dark color theme for Visual Studio Code, made by CyberStudios.

**`dream in pixels. create without limits.`**

☁️　♡　💿　✧

## 💾 bring it to your desktop

1. Open the **Extensions** view in VS Code.
2. Open its **…** menu and choose **Install from VSIX…**
3. Choose `dist/cyberstudios-steel-horizon-1.0.0.vsix` from this project.
4. Open **Preferences: Color Theme** from the Command Palette and select **Steel Horizon**.

Use **Ctrl+K, Ctrl+T** on Windows/Linux or **⌘K, ⌘T** on macOS to open the theme picker. Requires VS Code 1.100.0 or later. If you downloaded source without a VSIX, follow the packaging step below first.

## ✧ inside this little workspace

- Matching tabs, sidebar, activity bar, status bar, menus, inputs, and notifications.
- TextMate syntax rules plus semantic highlighting for language services that provide it.
- All 16 ANSI terminal colors, diff colors, Git decorations, debugger controls, and notebook surfaces.
- Regular comments, distinct syntax colors, and subtle selections.
- No runtime extension code, network requests, telemetry, extra theme dependencies, or font requirements.

| Palette role | Color |
| --- | --- |
| editor | `#151C25` |
| side | `#1B2531` |
| accent | `#93B4D2` |
| keyword | `#AABEDC` |
| function | `#B7D9EC` |
| string | `#ABC4B1` |
| number | `#D9BD8F` |
| type | `#98C7D4` |

## 🎀 make it yours

Edit `themes/steel-horizon-color-theme.json` to change the theme itself. `colors` controls the VS Code interface; `tokenColors` and `semanticTokenColors` control syntax. Selection and current-line backgrounds are tuned for readable contrast.

For a live development preview, open this folder in VS Code and press **F5**. In the Extension Development Host, select **Steel Horizon** and open files from `samples/`. If you have a custom F5 shortcut, run **Debug: Start Debugging** instead. The development window uses your editor configuration; the theme does not overwrite it.

Prefer a personal override? Add this to your existing VS Code settings:

```jsonc
"editor.tokenColorCustomizations": {
  "[Steel Horizon]": {
    "textMateRules": [
      { "scope": "comment", "settings": { "fontStyle": "" } }
    ]
  }
},
"editor.semanticTokenColorCustomizations": {
  "[Steel Horizon]": {
    "rules": { "comment": { "italic": false } }
  }
}
```

Merge these keys with any existing customizations rather than replacing your settings file.

## 💿 package your copy

With Node.js 22 or later installed, open a terminal in this folder and run:

```sh
npm run package
```

This downloads Microsoft's pinned `@vscode/vsce` packager if needed and writes an installable VSIX to `dist/`. It does not publish anything. The source is included in the CyberStudios VS Code theme collection. `dist/` is ignored by Git; attach the VSIX to a GitHub Release if you want to distribute a built copy.

The manifest uses `cyberthreed` as the extension publisher namespace. Marketplace publishing would require a matching registered publisher or a manifest change; no Marketplace registration or listing is implied. The repository URL points to CyberStudios, with this theme's folder recorded in the manifest.

## ☁️ a little preview note

Color themes style the editor's colors and syntax. Fonts, file icons, window layout, and custom extension webviews follow your VS Code setup. Language extensions can add their own semantic tokens; use **Developer: Inspect Editor Tokens and Scopes** when tuning a language. Personal color overrides and OS high-contrast settings can change the result.

## ♡ the small print

MIT. Made by [CyberStudios](https://github.com/cyberthreed/CyberStudios).

*made of pixels, daydreams & too many open tabs.* ♡
