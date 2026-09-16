#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import io
import json
import re
import time
import urllib.request
from pathlib import Path
from PIL import Image

RELEASE = "20260916-2"
SOURCE_URL = "https://pettomorrow.com/icons/pt-app-icon-v3-512.png"
APPROVED_SOURCE_SHA256 = "8ea56a80fee28b495fb986261475d00b765d283291c1df6f5b25ae0df1b35503"
OUT = Path("_site/pet-tomorrow")
THEME = "#149f91"
UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/142.0 Mobile Safari/537.36"


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def fetch_approved_icon() -> bytes:
    req = urllib.request.Request(
        f"{SOURCE_URL}?verify={time.time()}",
        headers={"User-Agent": UA, "Cache-Control": "no-cache, no-store"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read()
        assert response.status == 200, f"HTTP {response.status}: {SOURCE_URL}"
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "Approved Pet Tomorrow app icon is not PNG"
    actual = sha_bytes(data)
    assert actual == APPROVED_SOURCE_SHA256, f"Approved Pet Tomorrow app icon drifted: {actual}"
    return data


def save_png(image: Image.Image, path: Path) -> None:
    image.save(path, format="PNG", optimize=True)


def build_icons(source_bytes: bytes) -> dict[str, str]:
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(io.BytesIO(source_bytes)).convert("RGB")
    assert source.size == (512, 512), f"Unexpected approved logo size: {source.size}"
    resample = Image.Resampling.LANCZOS

    # Preserve the approved Golden Retriever + cat + Pet Tomorrow artwork as-is
    # for Android/Chrome's primary 512px icon and for a human-auditable copy.
    (OUT / "pet-tomorrow-logo.png").write_bytes(source_bytes)
    (OUT / "icon-512.png").write_bytes(source_bytes)
    save_png(source.resize((192, 192), resample), OUT / "icon-192.png")
    save_png(source.resize((180, 180), resample), OUT / "apple-touch-icon.png")
    save_png(source.resize((48, 48), resample), OUT / "favicon-48.png")
    save_png(source.resize((32, 32), resample), OUT / "favicon-32.png")
    source.resize((64, 64), resample).save(
        OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )

    # Adaptive launchers crop maskable icons. Keep the full approved badge inside
    # the safe zone, on the same teal field as the approved artwork.
    maskable = Image.new("RGB", (512, 512), THEME)
    safe = source.resize((404, 404), resample)
    maskable.paste(safe, ((512 - 404) // 2, (512 - 404) // 2))
    save_png(maskable, OUT / "icon-512-maskable.png")

    return {
        name: sha_file(OUT / name)
        for name in [
            "pet-tomorrow-logo.png",
            "icon-192.png",
            "icon-512.png",
            "icon-512-maskable.png",
            "apple-touch-icon.png",
            "favicon-32.png",
            "favicon-48.png",
            "favicon.ico",
        ]
    }


def patch_html() -> None:
    path = OUT / "index.html"
    html = path.read_text(encoding="utf-8")

    # Remove all previous favicon/manifest declarations so the old paw cannot
    # win by link order in Chrome or Samsung's launcher.
    html = re.sub(
        r'<link\b[^>]*\brel=["\'][^"\']*(?:icon|manifest)[^"\']*["\'][^>]*>\s*',
        "",
        html,
        flags=re.I,
    )
    html = re.sub(
        r'<meta\b[^>]*\bname=["\'](?:application-name|apple-mobile-web-app-title|pgc-package)["\'][^>]*>\s*',
        "",
        html,
        flags=re.I,
    )

    links = "\n".join(
        [
            f'<link rel="manifest" href="./manifest.webmanifest?v={RELEASE}">',
            f'<link rel="icon" type="image/png" sizes="32x32" href="./favicon-32.png?v={RELEASE}">',
            f'<link rel="icon" type="image/png" sizes="48x48" href="./favicon-48.png?v={RELEASE}">',
            f'<link rel="icon" type="image/png" sizes="192x192" href="./icon-192.png?v={RELEASE}">',
            f'<link rel="icon" type="image/png" sizes="512x512" href="./icon-512.png?v={RELEASE}">',
            f'<link rel="shortcut icon" href="./favicon.ico?v={RELEASE}">',
            f'<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png?v={RELEASE}">',
            '<meta name="application-name" content="Pet Tomorrow">',
            '<meta name="apple-mobile-web-app-title" content="Pet Tomorrow">',
            '<meta name="mobile-web-app-capable" content="yes">',
            '<meta name="apple-mobile-web-app-capable" content="yes">',
            f'<meta name="pgc-package" content="pet-tomorrow-pwa-{RELEASE}">',
        ]
    )
    html = html.replace("</head>", links + "\n</head>", 1)
    html = html.replace("20260916-1", RELEASE)
    assert "data:image/svg+xml" not in html
    path.write_text(html, encoding="utf-8")


def write_manifest() -> None:
    manifest = {
        "name": "Pet Tomorrow",
        "short_name": "Pet Tomorrow",
        "id": "./",
        "start_url": f"./?source=pwa&release={RELEASE}",
        "scope": "./",
        "display": "standalone",
        "display_override": ["standalone", "minimal-ui"],
        "background_color": THEME,
        "theme_color": THEME,
        "description": "Pet Tomorrow — clever finds for happier pets.",
        "prefer_related_applications": False,
        "icons": [
            {"src": f"./icon-192.png?v={RELEASE}", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": f"./icon-512.png?v={RELEASE}", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": f"./icon-512-maskable.png?v={RELEASE}", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (OUT / "manifest.webmanifest").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def write_worker() -> None:
    assets = [
        "./",
        "./index.html",
        "./manifest.webmanifest",
        "./pet-tomorrow-logo.png",
        "./icon-192.png",
        "./icon-512.png",
        "./icon-512-maskable.png",
        "./apple-touch-icon.png",
        "./favicon-32.png",
        "./favicon-48.png",
        "./favicon.ico",
    ]
    worker = f"""const CACHE='pet-tomorrow-pwa-{RELEASE}';
const ASSETS={json.dumps(assets, separators=(',', ':'))};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{{await self.clients.claim();for(const k of await caches.keys())if(k.startsWith('pet-tomorrow-pwa-')&&k!==CACHE)await caches.delete(k);}})()));
self.addEventListener('fetch',e=>{{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.includes('/pet-tomorrow/'))return;e.respondWith(fetch(e.request,{{cache:'no-cache'}}).then(r=>{{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r;}}).catch(async()=>await caches.match(e.request)||((e.request.mode==='navigate')?await caches.match('./index.html'):null)||new Response('Unavailable offline',{{status:503}})));}});
"""
    (OUT / "sw.js").write_text(worker, encoding="utf-8")


def verify(icon_hashes: dict[str, str]) -> None:
    html = (OUT / "index.html").read_text(encoding="utf-8")
    manifest = json.loads((OUT / "manifest.webmanifest").read_text(encoding="utf-8"))
    worker = (OUT / "sw.js").read_text(encoding="utf-8")
    assert f"pet-tomorrow-pwa-{RELEASE}" in html
    assert f"pet-tomorrow-pwa-{RELEASE}" in worker
    assert manifest["display"] == "standalone"
    assert manifest["id"] == "./" and manifest["scope"] == "./"
    assert any(i.get("purpose") == "maskable" for i in manifest["icons"])
    assert sha_file(OUT / "pet-tomorrow-logo.png") == APPROVED_SOURCE_SHA256
    assert sha_file(OUT / "icon-512.png") == APPROVED_SOURCE_SHA256
    print("PET_TOMORROW_APPROVED_GOLDEN_RETRIEVER_CAT_ICON_OK")
    print(json.dumps(icon_hashes, indent=2, sort_keys=True))


def main() -> None:
    source_bytes = fetch_approved_icon()
    hashes = build_icons(source_bytes)
    patch_html()
    write_manifest()
    write_worker()
    verify(hashes)


if __name__ == "__main__":
    main()
