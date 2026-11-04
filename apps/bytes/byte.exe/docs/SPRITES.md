# Customize the Byte sprite atlas

The user approved the active artwork on November 4, 2026. Version 1.0.0 leaves its pixels unchanged. See [art provenance and generation prompts](ART-NOTES.md).

`src/assets/byte-reference-v2.png` is an RGBA PNG: **1024 × 1536 pixels**, arranged as **4 columns × 6 rows** of 256 × 256 cells. The same sheet animates the room cat and transparent desktop cat.

| State | Frame indices |
| --- | --- |
| idle | 0–3 |
| walk | 4–7 |
| sleep | 8–11 |
| pet | 12–15 |
| feed | 16–19 |
| play | 20–23 |

Indices run left to right, then down. The manifest repeats the first idle frame to extend its open-eye pause. Each state defines a frame duration in milliseconds.

## Replace with approved art

1. Export a transparent PNG or WebP sheet with equally sized cells. A self-contained SVG also works. Use no scripts, fonts, links, or external resources.
2. Save it in `src/assets/` with a simple filename such as `byte-approved.png`. Letters, numbers, underscores, and hyphens are supported; subfolders and URLs are rejected.
3. Edit `src/assets/sprites.json`: image filename, frameWidth/frameHeight, optional columns, facing, provenance, and animation indices.
4. Keep all five original states: idle, walk, sleep, pet, feed. Play is optional and falls back to idle when missing. A state can reuse frames from another state.
5. Restart, run tests, visually review all poses, and rebuild the Windows app.

Frame dimensions must be 8–256 pixels. Each state accepts 1–32 frame entries, indices 0–255, and durations of 60–5000 ms. `columns` can be 1–256; omit it for older single-row packs. `facing` must be left or right and controls automatic mirroring. All referenced frames must fit inside the image. Keep consistent scale and a common paw baseline across poses. Use transparent gutters and leave headroom for hearts or sparkles.

Example atlas manifest:

```json
{
  "placeholder": false,
  "image": "byte-approved.png",
  "frameWidth": 256,
  "frameHeight": 256,
  "columns": 4,
  "facing": "right",
  "animations": {
    "idle": { "frames": [0, 1, 2, 3], "frameMs": 350 },
    "walk": { "frames": [4, 5, 6, 7], "frameMs": 170 },
    "sleep": { "frames": [8, 9, 10, 11], "frameMs": 700 },
    "pet": { "frames": [12, 13, 14, 15], "frameMs": 240 },
    "feed": { "frames": [16, 17, 18, 19], "frameMs": 300 },
    "play": { "frames": [20, 21, 22, 23], "frameMs": 240 }
  }
}
```

The desktop size setting changes the window/displayed art, not the original image. The room uses a 256-pixel canvas. Themes change the room and speech bubbles without recoloring the mascot.

The old `placeholder-cat.svg` remains available. `npm run assets` recreates that geometric placeholder and tray icon and resets the manifest, overwriting any active atlas configuration. It does not regenerate the new art.

Replace `src/assets/icon.png` separately for a new tray icon. The current tray icon remains the original small placeholder; the room and desktop use the new art. The unsigned executable retains Electron's default file icon, which can be customized in a future signed-release configuration.
