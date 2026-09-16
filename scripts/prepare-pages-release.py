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

PAGES_ROOT = "https://barivan72.github.io/bvs-protocol/"
PET_LIVE = "https://pettomorrow.com/"
UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/142.0 Mobile Safari/537.36"
PET_RELEASE = "20260916-1"
PET_LOGO_SHA = "7b39d400d307a28ff90cd9a3b6495fc3e4dfe6dcb8497a8db3d243701408c649"
REX_LOGO_SHA = "5c9a2928fabef55fa8eefd2967aebd3499c60a55e66047ff448fe2e7a1462244"

OUT = Path("_site")
REX_OUT = OUT / "rex-relax"
PET_OUT = OUT / "pet-tomorrow"
FREEZE_MANIFEST = Path("/tmp/rex-relax-freeze-hashes.json")

REX_FILES = [
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "audio-v5-data.js",
    "audio-v5.js",
    "audio-v5-core.js",
    "rex-relax-logo.png",
    "icon-192.png",
    "icon-512.png",
    "icon-512-maskable.png",
    "apple-touch-icon.png",
]


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


def write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def preserve_rex_exactly() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    REX_OUT.mkdir(parents=True, exist_ok=True)
    (OUT / ".nojekyll").write_bytes(b"")

    hashes: dict[str, str] = {}
    for name in ("index.html", "404.html"):
        data = fetch(PAGES_ROOT + name)
        write(OUT / name, data)
        hashes[f"root/{name}"] = sha(data)

    for name in REX_FILES:
        data = fetch(PAGES_ROOT + "rex-relax/" + name)
        write(REX_OUT / name, data)
        hashes[name] = sha(data)

    logo = (REX_OUT / "rex-relax-logo.png").read_bytes()
    assert sha(logo) == REX_LOGO_SHA, "Frozen Rex Relax logo is not the approved logo"
    manifest = json.loads((REX_OUT / "manifest.webmanifest").read_text(encoding="utf-8"))
    assert manifest["name"] == "Rex Relax"
    assert manifest["display"] == "standalone"
    assert '"type": "music"' in (REX_OUT / "audio-v5-data.js").read_text(encoding="utf-8")

    FREEZE_MANIFEST.write_text(json.dumps(hashes, indent=2, sort_keys=True), encoding="utf-8")
    print("REX_RELAX_CAPTURED_BYTE_FOR_BYTE", len(REX_FILES), "files")


def patch_pet_html(html: str) -> str:
    assert "Pet Tomorrow — Clever finds for happier pets" in html
    for text in ("ずっと", "いっしょ", "ペットのもっと明るいあしたへ"):
        assert text in html

    old_icon = re.compile(r'<link href="data:image/svg\+xml,[^"]+" rel="icon"\s*/?>', re.I)
    replacement = "\n".join(
        [
            f'<link rel="manifest" href="./manifest.webmanifest?v={PET_RELEASE}"/>',
            f'<link rel="icon" type="image/png" sizes="192x192" href="./icon-192.png?v={PET_RELEASE}"/>',
            f'<link rel="icon" type="image/png" sizes="512x512" href="./icon-512.png?v={PET_RELEASE}"/>',
            f'<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png?v={PET_RELEASE}"/>',
            '<meta name="mobile-web-app-capable" content="yes"/>',
            '<meta name="apple-mobile-web-app-capable" content="yes"/>',
            '<meta name="apple-mobile-web-app-title" content="Pet Tomorrow"/>',
            f'<meta name="pgc-package" content="pet-tomorrow-pwa-{PET_RELEASE}"/>',
        ]
    )
    html, count = old_icon.subn(replacement, html, count=1)
    assert count == 1, "Expected exactly one obsolete paw favicon"
    assert "data:image/svg+xml" not in html
    return html


def make_pet_icons(logo_bytes: bytes) -> None:
    image = Image.open(io.BytesIO(logo_bytes)).convert("RGBA")
    assert image.width >= 97 and image.height >= 97
    mascot = image.crop((0, 0, 97, 97))
    resample = Image.Resampling.LANCZOS

    mascot.resize((192, 192), resample).save(PET_OUT / "icon-192.png")
    mascot.resize((512, 512), resample).save(PET_OUT / "icon-512.png")
    mascot.resize((180, 180), resample).save(PET_OUT / "apple-touch-icon.png")
    mascot.resize((1024, 1024), resample).save(PET_OUT / "app-icon-1024.png")

    maskable = Image.new("RGBA", (512, 512), "#183f35")
    safe = mascot.resize((410, 410), resample)
    maskable.alpha_composite(safe, (51, 51))
    maskable.save(PET_OUT / "icon-512-maskable.png")


def build_pet() -> None:
    PET_OUT.mkdir(parents=True, exist_ok=True)
    live_html = fetch(PET_LIVE).decode("utf-8", "replace")
    logo = fetch(PET_LIVE + "pt-logo-strip.png")
    assert logo[:8] == b"\x89PNG\r\n\x1a\n"
    assert sha(logo) == PET_LOGO_SHA, "Pet Tomorrow live logo changed unexpectedly"

    (PET_OUT / "index.html").write_text(patch_pet_html(live_html), encoding="utf-8")
    write(PET_OUT / "pt-logo-strip.png", logo)
    make_pet_icons(logo)

    manifest = {
        "name": "Pet Tomorrow",
        "short_name": "Pet Tomorrow",
        "id": "./",
        "start_url": f"./?source=pwa&release={PET_RELEASE}",
        "scope": "./",
        "display": "standalone",
        "display_override": ["standalone", "minimal-ui"],
        "background_color": "#f7f7f1",
        "theme_color": "#183f35",
        "description": "Pet Tomorrow — clever finds for happier pets.",
        "prefer_related_applications": False,
        "icons": [
            {"src": f"./icon-192.png?v={PET_RELEASE}", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": f"./icon-512.png?v={PET_RELEASE}", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": f"./icon-512-maskable.png?v={PET_RELEASE}", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (PET_OUT / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sw = f"""const CACHE='pet-tomorrow-pwa-{PET_RELEASE}';
const ASSETS=['./','./index.html','./manifest.webmanifest','./pt-logo-strip.png','./icon-192.png','./icon-512.png','./icon-512-maskable.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{{await self.clients.claim();for(const k of await caches.keys())if(k.startsWith('pet-tomorrow-pwa-')&&k!==CACHE)await caches.delete(k);}})()));
self.addEventListener('fetch',e=>{{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.includes('/pet-tomorrow/'))return;e.respondWith(fetch(e.request,{{cache:'no-cache'}}).then(r=>{{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r;}}).catch(async()=>await caches.match(e.request)||((e.request.mode==='navigate')?await caches.match('./index.html'):null)||new Response('Unavailable offline',{{status:503}})));}});
"""
    (PET_OUT / "sw.js").write_text(sw, encoding="utf-8")


def verify_local_pet() -> None:
    for pass_no in (1, 2, 3):
        html = (PET_OUT / "index.html").read_text(encoding="utf-8")
        manifest = json.loads((PET_OUT / "manifest.webmanifest").read_text(encoding="utf-8"))
        worker = (PET_OUT / "sw.js").read_text(encoding="utf-8")
        assert sha((PET_OUT / "pt-logo-strip.png").read_bytes()) == PET_LOGO_SHA
        assert "Pet Tomorrow — Clever finds for happier pets" in html
        assert "ずっと" in html and "いっしょ" in html and "ペットのもっと明るいあしたへ" in html
        assert "data:image/svg+xml" not in html
        assert f'pgc-package" content="pet-tomorrow-pwa-{PET_RELEASE}' in html
        assert manifest["name"] == "Pet Tomorrow" and manifest["display"] == "standalone"
        assert manifest["scope"] == "./" and manifest["id"] == "./"
        assert any(icon.get("purpose") == "maskable" for icon in manifest["icons"])
        for name, expected in (("icon-192.png", (192, 192)), ("icon-512.png", (512, 512)), ("icon-512-maskable.png", (512, 512)), ("apple-touch-icon.png", (180, 180)), ("app-icon-1024.png", (1024, 1024))):
            with Image.open(PET_OUT / name) as im:
                assert im.size == expected, (name, im.size)
        assert f"pet-tomorrow-pwa-{PET_RELEASE}" in worker
        print("PET_LOCAL_PASS", pass_no)


def main() -> None:
    preserve_rex_exactly()
    build_pet()
    verify_local_pet()
    print("PAGES_RELEASE_READY_REX_FROZEN_PET_TOMORROW_ADDED")


if __name__ == "__main__":
    main()
