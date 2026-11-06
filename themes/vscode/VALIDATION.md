# ✧ theme.library / local checks

**`dream in pixels. create without limits.`**

Checked on Windows with VS Code **1.144.1**, Node.js **24.22.1**, and Microsoft's `@vscode/vsce` **4.1.0** packager on 2026-11-06.

## ♡ checks that passed

- All eight projects packaged successfully into independent VSIX files.
- All eight VSIX files installed and loaded in a separate temporary VS Code profile. The user's normal VS Code profile was not used for installation.
- VS Code's theme exporter resolved all **396 specified interface colors per theme** to the expected values, with the correct light/dark theme kind.
- **696 contrast checks** passed across the collection: syntax on normal, current-line, and selection backgrounds; sidebar and menu text; inputs and buttons; status controls; diagnostics; and all 16 terminal ANSI colors. The lowest tested pair was **4.52:1**.
- The installed VS Code TextMate grammars tokenized **80 sample files** across TypeScript, Python, HTML, CSS, JSON, YAML, SQL, shell, Markdown, and diff.
- **80 targeted syntax assertions** verified representative comments, keywords, strings, numbers, function names, types, JSON keys, HTML tags, and CSS properties against the intended palettes.
- Color IDs were checked against Microsoft's theme-color reference and then checked by loading the packages in VS Code. Three incorrect color IDs found during testing were corrected before the final build.

Machine-readable evidence: `validation/contrast.json`, `validation/syntax.json`, and `validation/vscode-load.json`.

## ☁️ a few things to know

These checks are not a complete accessibility audit. They cover selected text/background combinations, not every blend or state in VS Code. The palette previews were refined so selected and current-line code retains readable contrast.

The native editor was visually reviewed with Cy Afterhours. The `cy afterhours/images/preview.jpg` image is a real editor capture; its font, file icons, cursor, and window layout come from the test computer, not the theme package. Other themes passed the same automated loading and color checks; they have not all received a manual visual review.

Semantic rules are included and enabled. Exact token classification depends on language extensions and their language services. Third-party extension webviews may use their own colors. Fonts, file icons, window layout, user overrides, and OS high-contrast behavior are outside a color theme's control.

VS Code 1.100.0 is the declared minimum. This build was exercised on 1.144.1; older supported versions may ignore interface color IDs that were introduced later. The packages have not been tested on macOS, Linux, or every language extension.

## 💿 check your copy

From the collection folder, after installing the pinned development tools with `npm ci --ignore-scripts`:

```sh
npm run check
npm run package
```

`npm run smoke` opens a separate VS Code test window, installs the local VSIX packages in a temporary profile, and runs the loading checks. It is Windows-specific, expects VS Code in its usual per-user installation folder, and can use an alternate installation through the `VSCODE_INSTALL` environment variable. It does not publish anything or install the themes in your normal profile.

Reference documentation: [VS Code theme colors](https://code.visualstudio.com/api/references/theme-color), [color theme format](https://code.visualstudio.com/api/extension-guides/color-theme), and [extension integration testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension).
