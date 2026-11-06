# ♡ concrete day ✧

**`cyberstudios / theme.library / concrete-day`**

**Quiet structure. Room to think.**

Light stone, graphite, and slate blue. A restrained daylight theme with rust keywords, deep green strings, and regular comments.

A standalone light color theme for Visual Studio Code, made by CyberStudios.

**`dream in pixels. create without limits.`**

☁️　♡　💿　✧

## 💾 bring it to your desktop

1. Open the **Extensions** view in VS Code.
2. Open its **…** menu and choose **Install from VSIX…**
3. Choose `dist/cyberstudios-concrete-day-1.0.0.vsix` from this project.
4. Open **Preferences: Color Theme** from the Command Palette and select **Concrete Day**.

Use **Ctrl+K, Ctrl+T** on Windows/Linux or **⌘K, ⌘T** on macOS to open the theme picker. Requires VS Code 1.100.0 or later. If you downloaded source without a VSIX, follow the packaging step below first.

## ✧ inside this little workspace

- Matching tabs, sidebar, activity bar, status bar, menus, inputs, and notifications.
- TextMate syntax rules plus semantic highlighting for language services that provide it.
- All 16 ANSI terminal colors, diff colors, Git decorations, debugger controls, and notebook surfaces.
- Regular comments, distinct syntax colors, and subtle selections.
- No runtime extension code, network requests, telemetry, extra theme dependencies, or font requirements.

| Palette role | Color |
| --- | --- |
| editor | `#F3F2ED` |
| side | `#E7E9E5` |
| accent | `#465F69` |
| keyword | `#7E4937` |
| function | `#355E75` |
| string | `#466247` |
| number | `#865432` |
| type | `#4A5D73` |

## 🎀 make it yours

Edit `themes/concrete-day-color-theme.json` to change the theme itself. `colors` controls the VS Code interface; `tokenColors` and `semanticTokenColors` control syntax. Selection and current-line backgrounds are tuned for readable contrast.

For a live development preview, open this folder in VS Code and press **F5**. In the Extension Development Host, select **Concrete Day** and open files from `samples/`. If you have a custom F5 shortcut, run **Debug: Start Debugging** instead. The development window uses your editor configuration; the theme does not overwrite it.

Prefer a personal override? Add this to your existing VS Code settings:

```jsonc
"editor.tokenColorCustomizations": {
  "[Concrete Day]": {
    "textMateRules": [
      { "scope": "comment", "settings": { "fontStyle": "" } }
    ]
  }
},
"editor.semanticTokenColorCustomizations": {
  "[Concrete Day]": {
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
