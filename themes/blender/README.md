# ♡ cyberstudios / blender.theme.library ✧

**`dream in pixels. create without limits.`**

☁️　🎀　🧊　🫧　💿　✧　🐈‍⬛

*somewhere between a daydream and a 3D viewport.*

---

### ୨୧ a little wardrobe for your workspace ♡

**Nine cute palettes. Nine masculine palettes. Two original Cotton Candy editions.**

A little strawberry sweetness. A sleepy plum night. Warm bronze, deep pine, cool steel, and quiet stone. Different windows for whatever you're making next, all from **CyberStudios**.

This collection contains **twenty Blender XML presets** across nineteen project folders. Each theme has its own README, and every new palette has an illustrated preview.

**[♡ Open the offline gallery](gallery.html)** — download the HTML and open it in a browser to compare palettes and download individual XML files. All twenty preset files are embedded.

![Eighteen new CyberStudios Blender palettes](preview-collection.png)

*Palette illustrations, not Blender screenshots. The nine cute themes are shown first, followed by the nine masculine themes.*

---

### 🎀 the cute collection

| Theme | Mode | Little atmosphere |
|---|---|---|
| **[Strawberry Milk](strawberry%20milk/)** | Light | Baby pink, vanilla cream, and berry-colored details. A little strawberry sweetness between the panels. |
| **[Lavender Macaron](lavender%20macaron/)** | Light | Whipped lilac, periwinkle, and soft plum. A tidy little patisserie for your polygons. |
| **[Peach Parfait](peach%20parfait/)** | Light | Peach, vanilla, and a spoonful of sage. Warm light for the next little world on your screen. |
| **[Moonlit Bunny](moonlit%20bunny/)** | Dark | A sleepy plum night with lilac, pink, and starlight-blue accents. Cute has a night room, too. |
| **[Mint Meringue](mint%20meringue/)** | Light | Pale mint, sea-glass green, and a puff of cream. Cool, airy light for a clean and gentle workspace. |
| **[Blush Chiffon](blush%20chiffon/)** | Light | Dusty rose, warm mauve, and a drift of blush chiffon. Soft and elegant, with a quiet romantic streak. |
| **[Sakura Dusk](sakura%20dusk/)** | Dark | Deep rosewood evening with blossom-pink light. A tender night room for late sessions. |
| **[Sky Sorbet](sky%20sorbet/)** | Light | Powder blue, cloud white, and a scoop of periwinkle. Bright daytime air for open, breezy scenes. |
| **[Butter Bloom](butter%20bloom/)** | Light | Buttercream, honey, and a petal of rose. Sunny warmth for a cheerful and cozy desk. |

### ⌘ the masculine collection

| Theme | Mode | Little atmosphere |
|---|---|---|
| **[Obsidian Forge](obsidian%20forge/)** | Dark | Warm charcoal, bronze, and pale steel. A solid workbench for heavy ideas and careful detail. |
| **[Steel Horizon](steel%20horizon/)** | Dark | Midnight navy, brushed blue, and cool silver. Clear lines for a long view of the project. |
| **[Timberline](timberline/)** | Dark | Deep pine, olive, and weathered brass. A quiet cabin for complex scenes. |
| **[Concrete Day](concrete%20day/)** | Light | Stone, graphite, and a restrained slate-blue accent. Bright, deliberate, and ready for the next build. |
| **[Iron Oxide](iron%20oxide/)** | Dark | Deep umber, forged iron, and a rust-orange spark. A heavy, hard-working shop for big builds. |
| **[Deep Current](deep%20current/)** | Dark | Petrol teal, cold-water blue, and sea-foam highlights. A focused deep-water workspace. |
| **[Desert Sandstone](desert%20sandstone/)** | Light | Sun-baked sand, khaki, and a deep clay accent. Warm, dry light with firm edges. |
| **[Carbon Volt](carbon%20volt/)** | Dark | Neutral near-black with a sharp electric lime edge. Crisp and fast for long technical sessions. |
| **[Ridgeline](ridgeline/)** | Light | Misty granite, fir green, and cold mountain air. Calm daylight with a steady forest accent. |

### 🌸 the original cotton candy room

**[Cybercore Cotton Candy · Soft & Vivid](cybercore%20cotton%20candy/)** brings baby pink, lavender, powder blue, and pearl white into Blender. Both original presets are included alongside the eighteen new themes.

---

### 💾 pick a palette. bring it home.

1. Open a theme folder and download its XML file, or download the **presets ZIP** from the collection's GitHub Release.
2. Extract the ZIP if you downloaded the collection.
3. In Blender, open **Edit → Preferences → Themes → Install…**.
4. Select the XML preset you want. Save Preferences if automatic saving is off.

Prefer a switcher? The [CyberStudios Theme Switcher](https://cyberthreed.github.io/CyberStudios/projects/theme-switcher.html) add-on bundles all twenty themes: [get the add-on](https://github.com/cyberthreed/CyberStudios/releases/tag/blender-theme-switcher-v1.0.0).

**Installers only need XML.** The `tools/` folders, palette catalog, preview images, and documentation are source and support files. They are safe to include in the repository upload, and do not need to be installed in Blender.

### 🫧 checked, with a few little notes

- All **twenty** presets passed native XML import and export round-trip checks in **Blender 5.2.3 LTS**.
- Each of the eighteen new themes has **649 color fields** checked against Blender's installed API.
- The new palettes passed 4.5:1 checks for primary text, panel/header/control text, selected text, syntax, and node-header color pairs. This does not establish full accessibility conformance.
- The previews are interface illustrations. Exact Blender spacing, display appearance, and some overlays depend on your settings.
- Other Blender versions have not been tested. No saved Blender preferences were changed during validation.

See [validation.json](validation.json) for the recorded checks.

### 🛠️ for the curious code people

Edit `palettes.json` to change one of the eighteen new palettes. With Blender available as `blender`, run:

```sh
blender --background --factory-startup --disable-autoexec --python-exit-code 1 --python tools/build_themes.py
```

On Windows, regenerate the palette illustrations with PowerShell, then rebuild the documentation and gallery with Node.js:

```powershell
.\tools\render_previews.ps1
node .\tools\build_docs.cjs
```

The documentation command regenerates the READMEs and gallery from the catalog. Keep hand-edited palette choices in the catalog before rebuilding. Cotton Candy retains its own builder inside its project folder; the collection check validates its current XML files too.

The code, XML themes, and code-drawn previews in this collection use the [MIT License](LICENSE). Preserve required copyright and license notices. Existing third-party terms continue to apply to any separately supplied material.

### 🐈‍⬛ a note from the studio

Cy brings the next idea. Byte finds a comfortable place to watch it happen. Somewhere between them, another workspace starts to feel like home.

**[♡ Explore CyberStudios](https://github.com/cyberthreed/CyberStudios)** · **[💿 Visit the Wiki](https://cyberthreed.github.io/CyberStudios/)**

*Stay curious. Stay creative. Stay a little unreal.*

---

**♡ CYBERSTUDIOS ✧**

**`dream in pixels. create without limits.`**

`made of pixels, daydreams & too many open tabs.`

☁️　♡　🫧　✧　🐈‍⬛　💿
