#!/usr/bin/env python3
"""Build the distance-field texture behind the homepage logo morph.

Each logo becomes a signed distance field (how far every point is from the logo's edge),
centred in a square with the logo's longer side filling (1 - 2*PAD) of it. The three fields
are packed into the R, G and B channels of one PNG, in display order. docs/assets/js/site.js
blends between channels to morph one logo into the next.

Usage: python3 tools/morph_sdf.py   (needs: numpy, scipy, pillow)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "docs/assets/img"
LOGOS = [  # display order (Eli's pick): monogram -> dragon -> lotus (design option D4)
    IMG / "emb-810d67df/1500.png",
    IMG / "dragon-ea20b9d5/1500.png",
    IMG / "lotus-d4/orig.png",
]
OUT = IMG / "home-morph/logos-sdf.png"
SIZE = 1024   # texture size
WORK = 2048   # resolution the distance transform runs at
PAD = 0.14    # empty margin on each side, as a fraction of the square (also read by site.js)
SPREAD = 128  # distance (in texture pixels) covered by the 0..255 range on each side of the edge


def field(path):
    im = Image.open(path).convert("RGBA")
    white = Image.new("RGBA", im.size, "white")
    white.alpha_composite(im)
    ink = white.convert("L")
    scale = WORK * (1 - 2 * PAD) / max(ink.size)
    ink = ink.resize((round(ink.size[0] * scale), round(ink.size[1] * scale)), Image.LANCZOS)
    canvas = Image.new("L", (WORK, WORK), 255)
    canvas.paste(ink, ((WORK - ink.size[0]) // 2, (WORK - ink.size[1]) // 2))
    inside = np.asarray(canvas) < 128
    signed = distance_transform_edt(~inside) - distance_transform_edt(inside)  # >0 outside the logo
    signed *= SIZE / WORK
    small = Image.fromarray(signed.astype(np.float32), mode="F").resize((SIZE, SIZE), Image.BILINEAR)
    return np.clip(0.5 + np.asarray(small) / (2 * SPREAD), 0, 1)


def main():
    rgb = np.stack([field(p) for p in LOGOS], axis=-1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.round(rgb * 255).astype(np.uint8), mode="RGB").save(OUT, optimize=True)
    print(OUT.relative_to(ROOT), OUT.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
