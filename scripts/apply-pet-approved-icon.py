#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import io
import json
import re
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

RELEASE = "20260916-4"
HERO_URL = "https://pettomorrow.com/pt-hero-pets.png"
STRIP_URL = "https://pettomorrow.com/pt-logo-strip.png"
STRIP_SHA256 = "7b39d400d307a28ff90cd9a3b6495fc3e4dfe6dcb8497a8db3d243701408c649"
OUT = Path("_site/pet-tomorrow")
THEME = "#0aa89a"
UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/142.0 Mobile Safari/537.36"


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def fetch(url: str) -> bytes:
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(
        f"{url}{sep}verify={time.time()}",
        headers={"User-Agent": UA, "Cache-Control": "no-cache, no-store"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read()
        assert response.status == 200, f"HTTP {response.status}: {url}"
        return data


def save_png(image: Image.Image, path: Path) -> None:
    image.save(path, format="PNG", optimize=True)


def synthesize_logo(hero_bytes: bytes, strip_bytes: bytes) -> Image.Image:
    hero = Image.open(io.BytesIO(hero_bytes)).convert("RGB")
    strip = Image.open(io.BytesIO(strip_bytes)).convert("RGBA")
    assert hero.width > hero.height >= 400
    assert strip.width >= 250 and strip.height >= 70

    size = 1024
    canvas = Image.new("RGB", (size, size), THEME)
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((36, 36, 988, 988), fill="white")

    # Use the live Golden Retriever + cat artwork, tightly cropped around the pets.
    crop_size = hero.height
    left = min(max(0, int(hero.width * 0.12)), hero.width - crop_size)
    pets = hero.crop((left, 0, left + crop_size, crop_size)).resize((860, 860), Image.Resampling.LANCZOS)
    mask = Image.new("L", (860, 860), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 860, 860), fill=255)
    canvas.paste(pets, (82, 70), mask)

    # White brand panel and the existing PetTomorrow wordmark/tagline, without the old paw-only favicon.
    draw.rounded_rectangle((56, 660, 968, 986), radius=82, fill="white")
    text_crop = strip.crop((max(105, int(strip.width * 0.33)), 0, strip.width, strip.height))
    target_w = 780
    target_h = int(text_crop.height * target_w / text_crop.width)
    text_crop = text_crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
    canvas.paste(text_crop, ((size - target_w) // 2, 700), text_crop)
    return canvas


def build_icons(hero_bytes: bytes, strip_bytes: bytes) -> dict[str, str]:
    OUT.mkdir(parents=True, exist_ok=True)
    source = synthesize_logo(hero_bytes, strip_bytes)
    resample = Image.Resampling.LANCZOS

    save_png(source, OUT / "app-icon-1024.png")
    save_png(source.resize((512, 512), resample), OUT / "pet-tomorrow-logo.png")
    save_png(source.resize((512, 512), resample), OUT / "icon-512.png")
    save_png(source.resize((192, 192), resample), OUT / "icon-192.png")
    save_png(source.resize((180, 180), resample), OUT / "apple-touch-icon.png")
    save_png(source.resize((48, 48), resample), OUT / "favicon-48.png")
    save_png(source.resize((32, 32), resample), OUT / "favicon-32.png")
    source.resize((64, 64), resample).save(
        OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )

    maskable = Image.new("RGB", (512, 512), THEME)
    safe = source.resize((404, 404), resample)
    maskable.paste(safe, ((512 - 404) // 2, (512 - 404) // 2))
    save_png(maskable, OUT / "icon-512-maskable.png")

    hashes = {
        name: sha_file(OUT / name)
        for name in [
            "pet-tomorrow-logo.png",
            "app-icon-1024.png",
            "icon-192.png",
            "icon-512.png",
            "icon-512-maskable.png",
            "apple-touch-icon.png",
            "favicon-32.png",
            "favicon-48.png",
            "favicon.ico",
        ]
    }
    (OUT / "icon-sha256.txt").write_text(hashes["icon-512.png"] + "\n", encoding="utf-8")
    return hashes


def patch_html() -> None:
    path = OUT / "index.html"
    html = path.read_text(encoding="utf-8")
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
    # Register the new standalone worker last; it takes ownership of the Pet Tomorrow scope.
    html = html.replace(
        "</body>",
        "<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(console.warn));}</script></body>",
        1,
    )
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
        "./pt-logo-strip.png",
        "./pt-hero-pets.png",
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
    assert icon_hashes["icon-512.png"] == (OUT / "icon-sha256.txt").read_text().strip()
    assert sha_file(OUT / "pt-logo-strip.png") == STRIP_SHA256
    print("PET_TOMORROW_GOLDEN_RETRIEVER_CAT_LOGO_AND_PWA_OK")
    print(json.dumps(icon_hashes, indent=2, sort_keys=True))


def main() -> None:
    hero_bytes = fetch(HERO_URL)
    strip_bytes = fetch(STRIP_URL)
    assert hero_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    assert strip_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    assert sha_bytes(strip_bytes) == STRIP_SHA256
    (OUT / "pt-hero-pets.png").write_bytes(hero_bytes)
    (OUT / "pt-logo-strip.png").write_bytes(strip_bytes)
    hashes = build_icons(hero_bytes, strip_bytes)
    patch_html()
    write_manifest()
    write_worker()
    verify(hashes)


if __name__ == "__main__":
    main()
