#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import struct
import sys
import time
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/142.0 Mobile Safari/537.36"
PET_RELEASE = "20260916-1"
PET_LOGO_SHA = "7b39d400d307a28ff90cd9a3b6495fc3e4dfe6dcb8497a8db3d243701408c649"
REX_LOGO_SHA = "5c9a2928fabef55fa8eefd2967aebd3499c60a55e66047ff448fe2e7a1462244"
FREEZE_MANIFEST = Path("/tmp/rex-relax-freeze-hashes.json")


def fetch(url: str) -> bytes:
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(
        f"{url}{sep}verify={time.time()}",
        headers={"User-Agent": UA, "Cache-Control": "no-cache"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        body = response.read()
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}: {url}")
        return body


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def png_size(data: bytes) -> tuple[int, int]:
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    return struct.unpack(">II", data[16:24])


def verify_rex(root: str, frozen: dict[str, str]) -> None:
    assert sha(fetch(root + "rex-relax/rex-relax-logo.png")) == REX_LOGO_SHA
    for key, expected in frozen.items():
        if key.startswith("root/"):
            name = key.removeprefix("root/")
            actual = fetch(root + name)
        else:
            actual = fetch(root + "rex-relax/" + key)
        assert sha(actual) == expected, f"Rex Relax freeze violation after deploy: {key}"


def verify_pet(root: str) -> None:
    base = root + "pet-tomorrow/"
    html = fetch(base + "index.html").decode("utf-8", "replace")
    manifest = json.loads(fetch(base + "manifest.webmanifest").decode("utf-8"))
    worker = fetch(base + "sw.js").decode("utf-8")
    logo = fetch(base + "pt-logo-strip.png")
    icon192 = fetch(base + "icon-192.png")
    icon512 = fetch(base + "icon-512.png")
    maskable = fetch(base + "icon-512-maskable.png")
    apple = fetch(base + "apple-touch-icon.png")

    assert sha(logo) == PET_LOGO_SHA
    assert png_size(icon192) == (192, 192)
    assert png_size(icon512) == (512, 512)
    assert png_size(maskable) == (512, 512)
    assert png_size(apple) == (180, 180)
    assert manifest["name"] == "Pet Tomorrow"
    assert manifest["display"] == "standalone"
    assert manifest["scope"] == "./" and manifest["id"] == "./"
    assert manifest["prefer_related_applications"] is False
    assert any(icon.get("purpose") == "maskable" for icon in manifest["icons"])
    assert "Pet Tomorrow — Clever finds for happier pets" in html
    assert "ずっと" in html and "いっしょ" in html and "ペットのもっと明るいあしたへ" in html
    assert "data:image/svg+xml" not in html
    assert f"pet-tomorrow-pwa-{PET_RELEASE}" in html
    assert f"pet-tomorrow-pwa-{PET_RELEASE}" in worker


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: verify-pages-public.py <page_url>")
    root = sys.argv[1].rstrip("/") + "/"
    frozen = json.loads(FREEZE_MANIFEST.read_text(encoding="utf-8"))
    for pass_no in (1, 2, 3):
        verify_rex(root, frozen)
        verify_pet(root)
        print("PUBLIC_PASS", pass_no, "REX_RELAX_BYTE_IDENTICAL", "PET_TOMORROW_PWA_OK", root + "pet-tomorrow/")
        time.sleep(1)


if __name__ == "__main__":
    main()
