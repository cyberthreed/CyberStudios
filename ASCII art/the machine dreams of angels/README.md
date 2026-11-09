# ✧ the machine dreams of angels

**ASCII APPARITION EXHIBITION / #00**

*something sacred inside obsolete hardware.*

An angel made of characters, light, and the quiet hum of a machine.

**The Machine Dreams of Angels** is an interactive ASCII artwork exploring the space between digital decay and something almost divine. Thousands of tiny characters come together to form a moving apparition, complete with shifting details, soft glowing colors, and an atmosphere that feels slightly otherworldly.

A little experiment in making computers dream. ♡

### ☾ step inside the apparition

[♡ View the interactive exhibition](https://cyberthreed.github.io/CyberStudios/ascii-art/exhibition/00-the-machine-dreams-of-angels/)

### 💿 behind the screen

The artwork uses an image-to-ASCII conversion pipeline, a character-based rendering system, and procedural animation.

The published viewer uses a **144 × 163 character grid**, with 13,741 occupied cells in its base frame, six palette colors, and an HTML5 Canvas renderer.

Visitors can pause the animation, toggle glow, and adjust movement speed and **presence**, the slider that controls how much of the artwork's character density is visible.

Higher-resolution text exports are also generated for development and comparison.

**About `reference.jpg`:** the original source illustration is not included in this repository. Everything committed here works without it: `python main.py` and the published page read the saved `outputs/page_frame.json`, and the text, HTML, and PNG exports in `outputs/` are ready to view. Regenerating the artwork (`ascii_art.py`, or `main.py` after deleting `outputs/page_frame.json`) needs the original `reference.jpg` placed beside the scripts.

## Setup and technical notes

## Setup

```powershell
python -m pip install -r requirements.txt
python ascii_art.py --input reference.jpg --all
python main.py
```

Open `http://127.0.0.1:8770`. The VS Code task can run `run-preview.ps1` after the dependencies are installed.

## CLI

```powershell
python ascii_art.py --input reference.jpg --width 240 --mode detailed
python ascii_art.py --input reference.jpg --width 400 --mode ultra
python ascii_art.py --input reference.jpg --mode lineart --invert false
```

Options include `--contrast`, `--threshold`, `--edge-strength`, `--char-aspect`, and `--output-dir`. The default character cell aspect is `7/11`, which compensates for tall terminal glyphs. The converter uses Pillow for image loading and text-derived raster output, NumPy for pixel processing, and OpenCV for adaptive thresholding, Canny edges, and Sobel directions.

`--all` generates lineart at 160 columns, detailed at 240, and ultra at 320 and 400 columns. It also writes the zoomable/copyable HTML text view, a PNG rendered from the ASCII characters, a side-by-side comparison, and the page frame data.

## Fidelity notes

The conversion preserves the full image and aspect ratio, uses clean spaces for the light background, and combines density with directional edge glyphs. Fine ink strokes and dense crossings can merge at low widths; the 320- and 400-column ultra outputs retain substantially more detail. A character grid cannot reproduce every continuous pen stroke, so inspect `comparison.png` when choosing a publication resolution.