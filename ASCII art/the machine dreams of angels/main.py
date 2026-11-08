"""Serve the reference-derived ASCII cells through the copied angel page."""
import argparse
import json
import math
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from ascii_art import DEFAULT_OUTPUT, DEFAULT_INPUT, load_analysis, write_page_frame

ROOT = Path(__file__).resolve().parent
FRAME_PATH = DEFAULT_OUTPUT / "page_frame.json"
DEFAULT_PORT = 8770


def load_frame() -> dict:
    if not FRAME_PATH.is_file():
        analysis = load_analysis(DEFAULT_INPUT, 144, 7 / 11, 1.12, 7, 105)
        DEFAULT_OUTPUT.mkdir(parents=True, exist_ok=True)
        write_page_frame(FRAME_PATH, analysis)
    with FRAME_PATH.open("r", encoding="utf-8") as source:
        return json.load(source)


FRAME = load_frame()


def animate_cells(frame: dict, time: float, density: float) -> list[list[int]]:
    columns, rows = frame["columns"], frame["rows"]
    wave = 2 * math.pi * time / 10
    cells: list[list[int]] = []
    for cell in frame["cells"]:
        index = cell[0]
        noise = (index ^ (index >> 5)) * 0x45D9F3B
        noise ^= noise >> 16
        if (noise & 65535) / 65535 > density:
            continue
        col, row = index % columns, index // columns
        if col < columns * 0.38:
            side = -1
            influence = 1 - col / (columns * 0.38)
        elif col > columns * 0.62:
            side = 1
            influence = (col - columns * 0.62) / (columns * 0.38)
        else:
            side = 0
            influence = 0.0
        progress = row / max(1, rows - 1)
        phase = wave - progress * math.tau + side * 0.65
        animated = list(cell)
        if side:
            reach = 1.5 + 3.0 * influence
            animated_col = max(0, min(columns - 1,
                                      col - side * round(reach * math.sin(phase) * influence)))
            animated[0] = row * columns + animated_col
            animated[3] = max(1, min(15, cell[3] + round(0.9 * math.sin(phase))))
        else:
            center_distance = abs(col - columns / 2)
            sword_keepout = center_distance < 4 and progress > 0.40
            if not sword_keepout and columns * 0.34 < col < columns * 0.66:
                if 0.12 < progress < 0.58:
                    flow = math.sin(wave - progress * math.tau * 1.35 + center_distance * 0.04)
                    animated_col = col + round(1.7 * flow * (0.4 + progress))
                    animated[0] = row * columns + max(0, min(columns - 1, animated_col))
                    animated[3] = max(1, min(15, cell[3] + round(0.7 * flow)))
                elif 0.58 <= progress < 0.96:
                    flow = math.sin(wave - progress * math.tau * 1.7
                                    + (col - columns / 2) * 0.045)
                    animated_col = col + round(2.1 * flow)
                    animated[0] = row * columns + max(0, min(columns - 1, animated_col))
                    animated[3] = max(1, min(15, cell[3] + round(0.8 * flow)))
        cells.append(animated)
    return cells


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        route = urlsplit(self.path)
        if route.path == "/":
            self.reply(200, (ROOT / "preview.html").read_bytes(), "text/html; charset=utf-8")
        elif route.path == "/frame":
            query = parse_qs(route.query)
            try:
                time = float(query.get("time", ["0"])[0])
                density = float(query.get("density", ["1"])[0])
                if not math.isfinite(time) or not math.isfinite(density):
                    raise ValueError("time and density must be finite numbers")
                density = max(0.25, min(1.0, density))
                cells = animate_cells(FRAME, time, density)
                response = {**FRAME, "cells": cells}
                self.reply(200, json.dumps(response, separators=(",", ":")).encode(),
                           "application/json; charset=utf-8")
            except ValueError as error:
                message = json.dumps({"error": str(error)}).encode()
                self.reply(400, message, "application/json; charset=utf-8")
        elif route.path == "/health":
            self.reply(200, b'{"status":"ready","scene":"reference-ascii"}',
                       "application/json")
        elif route.path == "/favicon.ico":
            self.reply(204, b"", "image/x-icon")
        else:
            self.reply(404, b"Not found", "text/plain; charset=utf-8")

    def reply(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def log_message(self, *_: object) -> None:
        pass


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("--port must be between 1 and 65535")
    try:
        with ThreadingHTTPServer(("127.0.0.1", args.port), Handler) as server:
            server.daemon_threads = True
            print(f"ASCII preview ready: http://127.0.0.1:{args.port}", flush=True)
            print("Stop this preview with Ctrl+C.", flush=True)
            server.serve_forever()
    except KeyboardInterrupt:
        print("\nPreview stopped.")
    except OSError as error:
        print(f"Could not start the preview: {error}")
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()