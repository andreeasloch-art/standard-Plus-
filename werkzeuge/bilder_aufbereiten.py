#!/usr/bin/env python3
"""Lädt die Fotos (Unsplash-Lizenz) in hoher Auflösung und legt sie in zwei
Größen als WebP und JPG unter assets/img ab.

Aufruf: python3 werkzeuge/bilder_aufbereiten.py
"""
import io
import os
import urllib.request

from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")

# Ziel-Datei, Unsplash-Foto-ID, Seitenverhältnis (Breite/Höhe),
# horizontaler Bildschwerpunkt (0 = links, 1 = rechts), Breiten (groß, klein)
FOTOS = [
    ("branchen/bau",            "1589939705384-5185137a7f0f", 3 / 2, .5,  (1600, 800)),
    ("branchen/landwirtschaft", "1636998980792-63f27ddea4e3", 3 / 2, .5,  (1600, 800)),
    ("branchen/pferde",         "1576692192914-9abed71b3ef9", 3 / 2, .5,  (1600, 800)),
    ("branchen/pflege",         "1773227055624-07b515ba87c5", 3 / 2, .5,  (1600, 800)),
    ("branchen/logistik",       "1586528116022-aeda1613c63d", 3 / 2, .5,  (1600, 800)),
    ("branchen/gastronomie",    "1622021142947-da7dedc7c39a", 3 / 2, .5,  (1600, 800)),
    ("beratung",                "1758518730384-be3d205838e8", 3 / 2, .5,  (1800, 900)),
    ("beraterin",               "1758518730162-09a142505bfd", 4 / 5, .55, (1000, 560)),
]

# Sehr helle Fotos etwas kräftiger machen
KONTRAST = {"beratung": 1.12}


def laden(foto_id: str) -> Image.Image:
    url = f"https://images.unsplash.com/photo-{foto_id}?w=2600&q=90&fm=jpg"
    with urllib.request.urlopen(url, timeout=60) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def zuschneiden(im: Image.Image, ratio: float, cx: float) -> Image.Image:
    w, h = im.size
    if w / h > ratio:                      # zu breit → seitlich beschneiden
        nw = round(h * ratio)
        left = min(max(round(w * cx - nw / 2), 0), w - nw)
        return im.crop((left, 0, left + nw, h))
    nh = round(w / ratio)                  # zu hoch → oben/unten beschneiden
    top = (h - nh) // 2
    return im.crop((0, top, w, top + nh))


def speichern(im: Image.Image, ziel: str, breite: int) -> None:
    hoehe = round(breite * im.height / im.width)
    klein = im.resize((breite, hoehe), Image.LANCZOS)
    klein.save(ziel + ".jpg", quality=84, optimize=True, progressive=True)
    klein.save(ziel + ".webp", quality=82, method=6)


def main() -> None:
    for name, foto_id, ratio, cx, (gross, klein) in FOTOS:
        im = zuschneiden(laden(foto_id), ratio, cx)
        if name in KONTRAST:
            im = ImageEnhance.Contrast(im).enhance(KONTRAST[name])
        basis = os.path.join(IMG, name)
        speichern(im, basis, gross)
        speichern(im, basis + "-klein", klein)
        print(name, im.size, "→", gross, "/", klein)


if __name__ == "__main__":
    main()
