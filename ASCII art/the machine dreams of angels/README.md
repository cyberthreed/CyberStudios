# The Machine Dreams of Angels: Gothic ASCII

This separate project converts `reference.jpg` into edge-aware ASCII text and image previews. Its browser page is a copy of the angel page shell; the copied layout, controls, and six-color palette remain unchanged. The page art is generated from the local reference image.

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