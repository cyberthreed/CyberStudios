"""Convert ink illustrations into edge-aware, monospaced ASCII artwork."""
from __future__ import annotations

import argparse
import html
import json
import math
from pathlib import Path
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
DEFAULT_INPUT = ROOT / "reference.jpg"
DEFAULT_OUTPUT = ROOT / "outputs"
DENSITY_RAMP = "@%#*+=-:. "
FRAME_GLYPHS = " .,:;'+*oO@/\\|-"
PAGE_PALETTE = ("#453553", "#7c6598", "#c5b2ef", "#f3bdd8", "#b9d9ed", "#fff0f6")
MODE_GAMMA = {"lineart": 0.82, "detailed": 0.72, "ultra": 0.66}


def load_analysis(input_path: Path, width: int, char_aspect: float, contrast: float,
                  threshold: int, edge_strength: int) -> dict[str, np.ndarray]:
    if not input_path.is_file():
        raise FileNotFoundError(f"Reference image not found: {input_path}")
    with Image.open(input_path) as source:
        gray_source = ImageOps.exif_transpose(source).convert("L")
        source_width, source_height = gray_source.size
        if source_width < 1 or source_height < 1:
            raise ValueError(f"Reference image has invalid dimensions: {input_path}")
        rows = max(1, round(width * char_aspect * source_height / source_width))
        resized = gray_source.resize((width, rows), Image.Resampling.LANCZOS)
    gray = np.asarray(resized, dtype=np.uint8)
    contrasted = cv2.convertScaleAbs(gray, alpha=contrast,
                                     beta=127.5 * (1.0 - contrast))
    blurred = cv2.GaussianBlur(contrasted, (3, 3), 0)
    block_size = min(41, max(15, (min(width, rows) // 10) | 1))
    if block_size % 2 == 0:
        block_size += 1
    adaptive = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV,
        block_size, threshold,
    )
    edges = cv2.Canny(blurred, max(8, edge_strength // 3), edge_strength,
                      apertureSize=3, L2gradient=True)
    grad_x = cv2.Sobel(blurred, cv2.CV_32F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(blurred, cv2.CV_32F, 0, 1, ksize=3)
    return {"gray": contrasted, "adaptive": adaptive, "edges": edges,
            "grad_x": grad_x, "grad_y": grad_y}


def direction_glyph(grad_x: float, grad_y: float) -> str:
    tangent = (math.atan2(grad_y, grad_x) + math.pi / 2) % math.pi
    if tangent < math.pi / 8 or tangent >= 7 * math.pi / 8:
        return "-"
    if tangent < 3 * math.pi / 8:
        return "\\"
    if tangent < 5 * math.pi / 8:
        return "|"
    return "/"


def density_glyph(gray: int, mode: str) -> str:
    darkness = max(0.0, min(1.0, 1.0 - gray / 255.0))
    position = round((1.0 - darkness ** MODE_GAMMA[mode]) * (len(DENSITY_RAMP) - 1))
    return DENSITY_RAMP[position]


def render_ascii(analysis: dict[str, np.ndarray], mode: str, invert: bool = False,
                 edge_strength: int = 120) -> list[str]:
    gray = analysis["gray"]
    adaptive = analysis["adaptive"]
    edges = analysis["edges"]
    grad_x = analysis["grad_x"]
    grad_y = analysis["grad_y"]
    rows, columns = gray.shape
    lines: list[str] = []
    for y in range(rows):
        line: list[str] = []
        for x in range(columns):
            value = int(gray[y, x])
            darkness = 255 - value
            edge = int(edges[y, x])
            ink_mask = adaptive[y, x] > 0 or value < 116
            if mode == "lineart":
                if not ink_mask and edge < edge_strength:
                    glyph = " "
                elif edge >= edge_strength and darkness < 220:
                    glyph = direction_glyph(float(grad_x[y, x]), float(grad_y[y, x]))
                else:
                    glyph = density_glyph(value, mode)
                    if glyph == " ":
                        glyph = "."
            elif darkness < 10 and edge < edge_strength:
                glyph = " "
            elif edge >= edge_strength and darkness > 12:
                glyph = direction_glyph(float(grad_x[y, x]), float(grad_y[y, x]))
            else:
                glyph = density_glyph(value, mode)
                if edge >= edge_strength // 2 and glyph == " ":
                    glyph = "."
            if invert and glyph != " ":
                glyph = DENSITY_RAMP[-2 - DENSITY_RAMP.index(glyph)]
            line.append(glyph)
        lines.append("".join(line))
    return lines


def lines_to_text(lines: list[str]) -> str:
    return "\n".join(lines) + "\n"


def find_mono_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        Path("C:/Windows/Fonts/consola.ttf"),
        Path("C:/Windows/Fonts/cour.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
        Path("/Library/Fonts/Courier New.ttf"),
    )
    for font_path in candidates:
        if font_path.is_file():
            return ImageFont.truetype(str(font_path), size=size)
    return ImageFont.load_default()


def ascii_to_image(lines: list[str], font_size: int = 8, char_aspect: float = 7 / 11,
                   foreground: str = "#17131d", background: str = "#ffffff") -> Image.Image:
    font = find_mono_font(font_size)
    cell_width = max(1, round(font_size * 0.61))
    cell_height = max(1, round(cell_width / char_aspect))
    width = max((len(line) for line in lines), default=1) * cell_width + 16
    height = len(lines) * cell_height + 16
    image = Image.new("RGB", (width, height), background)
    draw = ImageDraw.Draw(image)
    for row, line in enumerate(lines):
        draw.text((8, 8 + row * cell_height), line, font=font, fill=foreground,
                  spacing=0)
    return image


def write_interactive_html(path: Path, lines: list[str], title: str) -> None:
    escaped = html.escape(lines_to_text(lines))
    document = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#fff;color:#16131a;font-family:Consolas,"Cascadia Mono","Courier New",monospace}}
header{{position:sticky;top:0;display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fff;border-bottom:1px solid #ddd;z-index:1}}
button,input{{font:inherit}}button{{background:#fff;border:1px solid #aaa;color:#17131d;padding:5px 9px;cursor:pointer}}
main{{overflow:auto;max-height:calc(100vh - 48px);padding:16px}}pre{{width:max-content;margin:0;font:var(--art-size,8px)/1.2 Consolas,"Cascadia Mono","Courier New",monospace;white-space:pre;color:#17131d}}
</style></head><body><header><button id="minus" aria-label="Decrease font size">A-</button>
<button id="plus" aria-label="Increase font size">A+</button><button id="copy">Copy ASCII</button>
<button id="download">Download TXT</button><span id="size">8 px</span></header>
<main><pre id="art">{escaped}</pre></main>
<script>"use strict";let px=8;const pre=document.getElementById("art");
function setSize(){{pre.style.setProperty("--art-size",px+"px");document.getElementById("size").textContent=px+" px"}}
document.getElementById("minus").onclick=()=>{{px=Math.max(4,px-1);setSize()}};
document.getElementById("plus").onclick=()=>{{px=Math.min(24,px+1);setSize()}};
document.getElementById("copy").onclick=()=>navigator.clipboard.writeText(pre.textContent);
document.getElementById("download").onclick=()=>{{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([pre.textContent],{{type:"text/plain"}}));a.download="angel_ultra.txt";a.click();URL.revokeObjectURL(a.href)}};
</script></body></html>'''
    path.write_text(document, encoding="utf-8")


def write_page_frame(path: Path, analysis: dict[str, np.ndarray], mode: str = "detailed") -> None:
    gray = analysis["gray"]
    edges = analysis["edges"]
    grad_x, grad_y = analysis["grad_x"], analysis["grad_y"]
    rows, columns = gray.shape
    palette = PAGE_PALETTE
    cells: list[list[int]] = []
    frame_ramp = "@Oo*+';:,. "
    for y in range(rows):
        for x in range(columns):
            value = int(gray[y, x])
            darkness = 255 - value
            edge = int(edges[y, x])
            if darkness < 15 and edge < 45:
                continue
            if edge > 110 and darkness < 205:
                character = direction_glyph(float(grad_x[y, x]), float(grad_y[y, x]))
            else:
                character = frame_ramp[min(len(frame_ramp) - 1,
                                           round(value / 255 * (len(frame_ramp) - 1)))]
            if character == " ":
                continue
            color = 5 if edge > 90 else (3 if x < columns / 2 else 4)
            level = max(4, min(15, round((0.34 + 0.66 * darkness / 255) * 15)))
            index = y * columns + x
            cells.append([index, FRAME_GLYPHS.index(character), color, level])
    path.write_text(json.dumps({"columns": columns, "rows": rows,
                                "palette": palette, "cells": cells},
                               separators=(",", ":")), encoding="utf-8")


def write_comparison(source_path: Path, ascii_image: Image.Image, destination: Path) -> None:
    with Image.open(source_path) as source:
        original = ImageOps.exif_transpose(source).convert("RGB")
    target_height = max(original.height, ascii_image.height)
    if original.height != target_height:
        target_width = round(original.width * target_height / original.height)
        original = original.resize((target_width, target_height), Image.Resampling.LANCZOS)
    if ascii_image.height != target_height:
        new_width = round(ascii_image.width * target_height / ascii_image.height)
        ascii_image = ascii_image.resize((new_width, target_height), Image.Resampling.NEAREST)
    margin = 24
    comparison = Image.new("RGB", (original.width + ascii_image.width + margin * 3,
                                   target_height + margin * 2), "#ffffff")
    comparison.paste(original, (margin, margin))
    comparison.paste(ascii_image, (margin * 2 + original.width, margin))
    comparison.save(destination)


def make_analysis_options(args: argparse.Namespace, width: int) -> dict[str, float | int]:
    return {"width": width, "char_aspect": args.char_aspect,
            "contrast": args.contrast, "threshold": args.threshold,
            "edge_strength": args.edge_strength}


def generate_all(args: argparse.Namespace) -> None:
    args.output_dir.mkdir(parents=True, exist_ok=True)
    outputs: dict[str, list[str]] = {}
    configurations = (("lineart", 160), ("detailed", 240),
                      ("ultra", 320), ("ultra", 400))
    for mode, width in configurations:
        analysis = load_analysis(args.input, **make_analysis_options(args, width))
        lines = render_ascii(analysis, mode, args.invert, args.edge_strength)
        name = f"angel_ultra_{width}" if mode == "ultra" and width == 320 else f"angel_{mode}"
        output_path = args.output_dir / f"{name}.txt"
        output_path.write_text(lines_to_text(lines), encoding="ascii", newline="")
        if mode == "ultra" and width == 400:
            sized_path = args.output_dir / "angel_ultra_400.txt"
            sized_path.write_text(lines_to_text(lines), encoding="ascii", newline="")
            print(f"Wrote {sized_path} ({width} columns x {len(lines)} rows)")
        outputs[name] = lines
        print(f"Wrote {output_path} ({width} columns x {len(lines)} rows)")
    detailed_lines = outputs["angel_detailed"]
    ultra_lines = outputs["angel_ultra"]
    html_path = args.output_dir / "angel_ultra.html"
    write_interactive_html(html_path, ultra_lines, "Angel · ultra ASCII")
    preview_image = ascii_to_image(detailed_lines, font_size=8,
                                   char_aspect=args.char_aspect)
    preview_path = args.output_dir / "angel_preview.png"
    preview_image.save(preview_path)
    comparison_path = args.output_dir / "comparison.png"
    write_comparison(args.input, preview_image, comparison_path)
    print(f"Wrote {html_path}")
    print(f"Wrote {preview_path}")
    print(f"Wrote {comparison_path}")
    page_width = 144
    page_analysis = load_analysis(args.input, **make_analysis_options(args, page_width))
    page_frame_path = args.output_dir / "page_frame.json"
    write_page_frame(page_frame_path, page_analysis)
    print(f"Wrote {page_frame_path}")


def parse_bool(value: str | bool) -> bool:
    if isinstance(value, bool):
        return value
    normalized = value.strip().lower()
    if normalized in {"true", "1", "yes", "on"}:
        return True
    if normalized in {"false", "0", "no", "off"}:
        return False
    raise argparse.ArgumentTypeError("expected true or false")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT,
                        help="source artwork (default: reference.jpg beside this script)")
    parser.add_argument("--width", type=int, default=240,
                        help="ASCII columns; height is calculated from source and character aspect")
    parser.add_argument("--mode", choices=("lineart", "detailed", "ultra"),
                        default="detailed")
    parser.add_argument("--contrast", type=float, default=1.12)
    parser.add_argument("--threshold", type=int, default=7,
                        help="adaptive threshold offset; smaller retains finer marks")
    parser.add_argument("--edge-strength", type=int, default=105,
                        help="Canny high threshold and edge-selection threshold")
    parser.add_argument("--char-aspect", type=float, default=7 / 11,
                        help="character cell width/height ratio")
    parser.add_argument("--invert", type=parse_bool, default=False, metavar="BOOL")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--all", action="store_true", help="generate all modes, sizes, and previews")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.width < 1:
        parser.error("--width must be greater than zero")
    if not 0.05 <= args.char_aspect <= 2.0:
        parser.error("--char-aspect must be between 0.05 and 2.0")
    if args.contrast <= 0:
        parser.error("--contrast must be greater than zero")
    if not 1 <= args.edge_strength <= 255:
        parser.error("--edge-strength must be between 1 and 255")
    try:
        if args.all:
            generate_all(args)
        else:
            args.output_dir.mkdir(parents=True, exist_ok=True)
            analysis = load_analysis(args.input, **make_analysis_options(args, args.width))
            lines = render_ascii(analysis, args.mode, args.invert, args.edge_strength)
            output_path = args.output_dir / f"angel_{args.mode}.txt"
            output_path.write_text(lines_to_text(lines), encoding="ascii", newline="")
            print(f"Wrote {output_path} ({args.width} columns x {len(lines)} rows)")
        return 0
    except (OSError, ValueError, cv2.error) as error:
        print(f"ascii_art: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())