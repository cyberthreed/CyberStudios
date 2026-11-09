"""Render the animated ASCII artwork as a vertical Instagram Reel video."""
from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

from main import FRAME, animate_cells
from ascii_art import FRAME_GLYPHS

ROOT = Path(__file__).resolve().parent
CELL_WIDTH, CELL_HEIGHT = 7, 11
OUTPUT_WIDTH, OUTPUT_HEIGHT = 1080, 1920
FONT_PATH = Path("C:/Windows/Fonts/consola.ttf")


def make_background(width: int, height: int) -> Image.Image:
    x, y = np.meshgrid(np.arange(width), np.arange(height))
    radius = np.sqrt(((x - width / 2) / (width * 0.55)) ** 2
                     + ((y - height * 0.42) / (height * 0.60)) ** 2)
    center = np.array((33, 24, 43), dtype=np.float32)
    middle = np.array((18, 14, 26), dtype=np.float32)
    edge = np.array((12, 9, 19), dtype=np.float32)
    first_mix = np.clip(radius / 0.66, 0, 1)[..., None]
    second_mix = np.clip((radius - 0.66) / 0.34, 0, 1)[..., None]
    rgb = center + (middle - center) * first_mix
    rgb = rgb + (edge - middle) * second_mix
    rgb[3::4] *= 0.97
    return Image.fromarray(np.uint8(np.clip(rgb, 0, 255)), "RGB")


def find_font() -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if FONT_PATH.is_file():
        return ImageFont.truetype(str(FONT_PATH), size=10)
    return ImageFont.load_default()


def render_frame(time: float, font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
                 background: Image.Image) -> Image.Image:
    columns, rows = FRAME["columns"], FRAME["rows"]
    canvas_size = (columns * CELL_WIDTH, rows * CELL_HEIGHT)
    ink = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(ink)
    for cell in animate_cells(FRAME, time, 1.0):
        index, glyph_index, color_index, level = cell
        glyph = FRAME_GLYPHS[glyph_index]
        if glyph == " ":
            continue
        x = (index % columns) * CELL_WIDTH
        y = (index // columns) * CELL_HEIGHT
        color = tuple(int(FRAME["palette"][color_index][i:i + 2], 16)
                      for i in (1, 3, 5))
        draw.text((x, y), glyph, font=font, fill=(*color, round(level / 15 * 255)))

    glow = ink.filter(ImageFilter.GaussianBlur(radius=4))
    glow_rgb = Image.new("RGB", canvas_size, (0, 0, 0))
    glow_rgb.paste(glow.convert("RGB"), mask=glow.getchannel("A"))
    screen_blend = ImageChops.screen(background, glow_rgb)
    frame = Image.blend(background, screen_blend, 0.16).convert("RGBA")
    frame = Image.alpha_composite(frame, ink)
    frame = frame.convert("RGB").resize((OUTPUT_WIDTH, OUTPUT_HEIGHT),
                                         Image.Resampling.LANCZOS)
    return frame


def open_writer(path: Path, fps: int) -> tuple[cv2.VideoWriter, str]:
    for codec in ("avc1", "H264", "mp4v"):
        writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*codec), fps,
                                 (OUTPUT_WIDTH, OUTPUT_HEIGHT))
        if writer.isOpened():
            return writer, codec
        writer.release()
        path.unlink(missing_ok=True)
    raise RuntimeError("No MP4 video encoder is available in this OpenCV build.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--duration", type=float, default=12.0,
                        help="video duration in seconds (default: 12)")
    parser.add_argument("--fps", type=int, default=30,
                        help="frames per second (default: 30)")
    parser.add_argument("--speed", type=float, default=0.25,
                        help="animation speed multiplier (default: 0.25)")
    parser.add_argument("--output", type=Path, default=ROOT / "outputs" / "angel_reel.mp4")
    args = parser.parse_args()
    if args.duration <= 0 or args.fps < 1 or args.speed < 0:
        parser.error("duration and fps must be positive; speed cannot be negative")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    background = make_background(FRAME["columns"] * CELL_WIDTH,
                                 FRAME["rows"] * CELL_HEIGHT)
    font = find_font()
    writer, codec = open_writer(args.output, args.fps)
    frame_count = round(args.duration * args.fps)
    try:
        for frame_number in range(frame_count):
            time = frame_number / args.fps * args.speed
            image = render_frame(time, font, background)
            writer.write(cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2BGR))
    finally:
        writer.release()

    if not args.output.is_file() or args.output.stat().st_size == 0:
        raise RuntimeError("Video writer did not produce an output file.")
    print(f"Wrote {args.output} ({OUTPUT_WIDTH}x{OUTPUT_HEIGHT}, {args.fps} fps, "
          f"{frame_count} frames, {args.duration:g} seconds, {codec})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())