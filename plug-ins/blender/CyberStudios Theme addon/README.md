# ✦ CyberStudios Theme Switcher

**your blender. your colors. your cyberspace.**

`CYBERSTUDIOS.EXE` · `BLENDER ADD-ON` · `VERSION 0.1.0`

---

### ✧ welcome to your new interface.

Your creative space should feel like it belongs to you.

**CyberStudios Theme Switcher** is a Blender add-on for collecting, switching, saving, importing, and exporting interface themes without digging through folders every time you want a different look.

Whether you're decorating Blender with CyberStudios' pastel Cybercore palettes, trying another creator's theme, or building a collection of your own, everything lives in one convenient place.

A little less file hunting. A lot more personal expression.

**dream in pixels. create without limits.**

---

## 01 // SYSTEM.FEATURES ✦

| Feature | Description |
|---|---|
| ✿ Quick Theme Switching | Switch between themes directly from Blender's Preferences. |
| ♡ 10 Bundled Themes | Explore the included CyberStudios theme collection. |
| ☁ Personal Theme Library | Save custom themes under names you choose. |
| ⌘ Paste Theme Code | Copy valid Blender XML theme code and save it as a reusable preset. |
| ✧ Import XML | Add theme files from your computer. |
| ⇩ Export Themes | Download copies of your themes as `.xml` files. |
| ❐ Copy Theme Code | Copy any listed theme's XML to your clipboard. |
| ☆ Save Current Theme | Capture your current Blender appearance as a named theme preset. |

**Three collections, one interface:**

- **CyberStudios Themes:** The ten presets bundled with the add-on.
- **My Saved Themes:** Your personally saved presets.
- **Other Installed Themes:** Compatible theme presets already installed in Blender.

Your saved themes are stored separately from the bundled collection.

---

## 02 // THE CYBERSTUDIOS COLLECTION ♡

A collection of ten different interface aesthetics, from soft pastel sweetness to darker, atmospheric palettes.

| Theme | File |
|---|---|
| ♡ Cybercore Cotton Candy Soft | `Cybercore_Cotton_Candy_Soft.xml` |
| ✿ Cybercore Cotton Candy Vivid | `Cybercore_Cotton_Candy_Vivid.xml` |
| ☾ Moonlit Bunny | `Moonlit_Bunny.xml` |
| ✧ Lavender Macaron | `Lavender_Macaron.xml` |
| ♡ Strawberry Milk | `Strawberry_Milk.xml` |
| ✿ Peach Parfait | `Peach_Parfait.xml` |
| ◇ Concrete Day | `Concrete_Day.xml` |
| ⌁ Steel Horizon | `Steel_Horizon.xml` |
| ✦ Obsidian Forge | `Obsidian_Forge.xml` |
| ☁ Timberline | `Timberline.xml` |

*Cybercore is CyberStudios' original aesthetic direction, blending pastel cyberspace, vaporwave nostalgia, dreamy digital environments, and soft futuristic interfaces.*

The theme manager isn't limited to that aesthetic. Other installed and user-created themes are welcome too.

---

## 03 // INSTALLATION.EXE

**Requirements**

- Blender 4.2 or newer, according to the add-on manifest
- Tested by the project on Blender 5.2.3 LTS
- CyberStudios Theme Switcher v0.1.0

**Installation**

1. Download the packaged add-on: `cyberstudios_theme_switcher-0.1.0.zip`.
2. Open Blender.
3. Navigate to **Edit → Preferences → Add-ons**.
4. Open the add-ons menu and choose **Install from Disk...**
5. Select the downloaded ZIP file.
6. Enable **CyberStudios Theme Switcher**.

You're ready to customize your creative space.

**Note:** Install the packaged add-on ZIP, not the entire GitHub repository.

---

## 04 // HOW TO USE

### ✧ Switch themes instantly

Open **Edit → Preferences → Themes**.

At the top, you'll find the **CyberStudios Theme Switcher** menu.

Select a theme from your bundled, saved, or installed collections to apply it.

For access to the full manager, open **Preferences → Add-ons → CyberStudios Theme Switcher**.

### ♡ Save a theme from XML code

Have a custom theme someone shared with you?

1. Copy its Blender XML theme code to your clipboard.
2. Open the CyberStudios Theme Switcher add-on preferences.
3. Enter a name in the **Name** field.
4. Click **Paste Theme Code**.
5. Click **Save Theme**.

Your new preset appears in **My Saved Themes**.

The add-on expects valid Blender theme XML with a `<bpy>` root and `<Theme>` element. It does not accept arbitrary Python scripts as theme presets.

### ✿ Import a theme file

Already downloaded a Blender theme?

1. Open the add-on preferences.
2. Click **Import XML File**.
3. Choose your `.xml` theme file.
4. Confirm or enter a name.
5. Click **Save Theme**.

Your imported theme is now part of your personal collection.

### ☁ Save your current Blender theme

Customized Blender's appearance and want to keep it?

Use **Save Current Theme As...** to give your active theme a name and save it to your collection.

### ⇩ Export and share themes

Each listed theme has options to apply, copy its XML code, or export it.

Use the **Export** icon to save a copy of the theme file to a location on your computer.

You can also copy its XML directly to your clipboard.

Only themes in **My Saved Themes** can be deleted through the manager. Bundled and other installed themes are protected from deletion through this interface.

---

## 05 // YOUR THEMES, YOUR SPACE

**Your collection belongs to you.**

Saved themes live in the add-on's user data directory, separately from the bundled theme files.

The add-on is designed so updating its bundled files doesn't erase your personal collection.

Some useful things to remember:

- Applying a theme changes your current Blender preferences.
- Use Blender's **Save Preferences** to keep the appearance after restarting.
- If a saved theme name already exists, choose another name or explicitly enable the overwrite option.
- Export important themes as `.xml` files if you want backups outside Blender.
- Only import theme XML from sources you trust.

Your creative environment can change as often as your ideas do.

---

## 06 // TECHNICAL DETAILS

| Property | Value |
|---|---|
| Add-on | CyberStudios Theme Switcher |
| Current version | 0.1.0 |
| Platform | Blender |
| Minimum declared version | Blender 4.2 |
| Reported tested version | Blender 5.2.3 LTS |
| Theme format | Blender XML (`.xml`) |
| Language | Python |
| License | MIT |
| Developer | CyberStudios |

### For developers

The add-on source is located in `cyberstudios_theme_switcher/`, alongside its extension manifest and bundled theme presets.

To build the installable ZIP on Windows, run the included `build.ps1` script from the project directory.

The script creates:

`cyberstudios_theme_switcher-0.1.0.zip`

The extension requests file access for theme import/export and clipboard access for copying and pasting theme XML.

---

## 07 // ABOUT CYBERSTUDIOS

**CyberStudios** is an independent creative development ecosystem exploring interactive software, game design, 3D art, digital worlds, and expressive tools.

Cybercore is more than a palette. It's an aesthetic language built around nostalgic technology, pastel futurism, liminal digital spaces, and making software feel personal again.

The Theme Switcher is a small piece of that larger creative vision: tools that help people make their digital environments feel like their own.

**Explore the cyberspace:**

- [CyberStudios on GitHub](https://github.com/cyberthreed/CyberStudios)
- [CyberStudios Website](https://cyberthreed.github.io/CyberStudios/)
- [Cyberthreed on GitHub](https://github.com/cyberthreed)

---

## 08 // LICENSE & CREDITS

Developed under **CyberStudios**.

Distributed under the **MIT License**. See the bundled `LICENSE` file for details.

Created for artists, developers, and anyone who believes their workspace should be as expressive as their imagination.

---

**✧ CYBERSTUDIOS © 2026**

`[ SYSTEM ONLINE ]`

*dream in pixels. create without limits.*
