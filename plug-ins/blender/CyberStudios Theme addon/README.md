# CyberStudios Theme Switcher

A Blender add-on for switching interface themes without hunting through folders.

- Switch between the ten CyberStudios Blender themes, your own saved themes and any other theme installed in Blender.
- Paste a theme's XML code, name it, and keep it in **My saved themes**.
- Import a theme `.xml` file from your computer.
- Save the theme Blender is using right now under a name.
- Copy any theme's code to the clipboard, or export it as an `.xml` file to your computer.

Tested on Blender 5.2.3 LTS. The manifest allows Blender 4.2 and newer.

## Install

1. Download `cyberstudios_theme_switcher-0.1.0.zip`.
2. In Blender, open **Edit > Preferences > Add-ons**, open the menu in the top right and choose **Install from Disk...**
3. Pick the zip and enable **CyberStudios Theme Switcher**.

## Use

- **Quick switch:** **Edit > Preferences > Themes** now has a **CyberStudios Theme Switcher** menu at the top.
- **Full manager:** open the add-on's entry under **Preferences > Add-ons** to apply, copy, export or delete themes and to add new ones.

### Add a theme from its code

1. Copy the theme's XML (it starts with `<bpy>` and `<Theme>`).
2. In the add-on preferences, type a **Name** and press **Paste Theme Code**.
3. Press **Save Theme**. It now appears under **My saved themes**.

A saved theme can be applied, copied, exported (**Export** icon) or deleted (**Trash** icon). Bundled and installed themes can be applied, copied and exported, never deleted by the add-on.

Applying a theme changes your Blender preferences. Use Blender's usual **Save Preferences** if you want it to stay after a restart.

Saved themes live in the add-on's user data folder, so updating the add-on doesn't remove them.

## Build the zip

Run `build.ps1` in this folder. It writes `cyberstudios_theme_switcher-0.1.0.zip` next to it.

MIT licensed. dream in pixels. create without limits.
