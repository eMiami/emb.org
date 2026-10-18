#!/usr/bin/env python3
"""Port emb.org (and padelspot.com/invest) off Squarespace into static files under docs/.

One-time conversion tool, kept for provenance and for re-running if a page needs
to be re-captured. It takes Squarespace's server-rendered HTML, removes every
Squarespace script, and copies every image, font, stylesheet, video and file the
pages use into docs/assets/, so the result has no dependency on Squarespace.
Interactive behaviour (galleries, lightbox, menu, video, animations) is provided
by docs/assets/js/site.js instead.

Usage:  python3 tools/port.py [page ...]  (needs: pillow, pymupdf; ffmpeg for videos)
Env:    PORT_CACHE  download cache dir   (default ~/.cache/emb-port)
        FFMPEG      ffmpeg binary         (default: ffmpeg on PATH)
"""
import hashlib
import html
import io
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
ASSETS = DOCS / "assets"
CACHE = Path(os.environ.get("PORT_CACHE", Path.home() / ".cache" / "emb-port"))
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"

EMB = "https://www.emb.org"
PADEL = "https://www.padelspot.com"
# (source url, output dir relative to docs/)
PAGES = [
    (EMB + "/", ""),
    (EMB + "/emb", "emb"),
    (EMB + "/contact", "contact"),
    (EMB + "/litig8", "litig8"),
    (EMB + "/portfolio", "portfolio"),
    (EMB + "/portfolio/bitfinance", "portfolio/bitfinance"),
    (EMB + "/portfolio/glass-chart", "portfolio/glass-chart"),
    (EMB + "/portfolio/gocase", "portfolio/gocase"),
    (EMB + "/portfolio/smelly-sock", "portfolio/smelly-sock"),
    (EMB + "/portfolio/emb", "portfolio/emb"),
    (EMB + "/portfolio/dragon", "portfolio/dragon"),
    (PADEL + "/invest", "portfolio/padelspot"),
]
# Stylesheets Squarespace's scripts add at runtime (not in the server HTML).
RUNTIME_CSS = {
    "emb": ["https://assets.squarespace.com/universal/styles-compressed/35ebb88013744865-min.en-US.css"],
    "padel": ["https://assets.squarespace.com/universal/styles-compressed/35ebb88013744865-min.en-US.css",
              "https://assets.squarespace.com/universal/styles-compressed/9eb34269c7fffaee-min.en-US.css"],
}
IMG_WIDTHS = (500, 1000, 1500, 2500)
SQS_HOSTS = r"(?:images|video|file)\.squarespace-cdn\.com|static1\.squarespace\.com|assets\.squarespace\.com|definitions\.sqspcdn\.com|use\.typekit\.net|p\.typekit\.net"


# ---------------------------------------------------------------- fetching

def fetch(url, binary=True):
    """GET with an on-disk cache keyed by URL."""
    if url.startswith("//"):
        url = "https:" + url
    key = hashlib.sha1(url.encode()).hexdigest()
    path = CACHE / key[:2] / key
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        for attempt in range(4):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=60) as r:
                    data = r.read()
                break
            except Exception as e:  # network hiccup: retry, then fail loudly
                if attempt == 3:
                    raise RuntimeError(f"fetch failed: {url}: {e}")
                time.sleep(2 * (attempt + 1))
        path.write_bytes(data)
    data = path.read_bytes()
    return data if binary else data.decode("utf-8")


def write(rel, data):
    out = DOCS / rel.lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        data = data.encode("utf-8")
    if not out.exists() or out.read_bytes() != data:
        out.write_bytes(data)
    return "/" + rel.lstrip("/")


def slug(s):
    s = urllib.parse.unquote_plus(s)
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "file"


def short(s):
    return hashlib.sha1(s.encode()).hexdigest()[:8]


# ---------------------------------------------------------------- images

class Images:
    """images.squarespace-cdn.com -> /assets/img/<name>-<hash>/<width>.<ext>"""

    def __init__(self):
        self.cache = {}

    def key(self, url):
        u = re.sub(r"^(https?:)?//", "", html.unescape(url)).split("?")[0]
        return u

    def get(self, url):
        k = self.key(url)
        if k in self.cache:
            return self.cache[k]
        fname = k.rsplit("/", 1)[-1]
        stem, _, ext = fname.rpartition(".")
        ext = (ext or "jpg").lower()
        if ext == "jpeg":
            ext = "jpg"
        folder = f"assets/img/{slug(stem)}-{short(k)}"
        src = "https://" + k
        if ext in ("gif", "svg", "ico", "webp"):
            data = fetch(src)
            p = write(f"{folder}/orig.{ext}", data)
            entry = {"variants": [(0, p)], "max": p, "w": 0}
        else:
            big = fetch(src + "?format=2500w")
            try:
                W = Image.open(io.BytesIO(big)).size[0]
            except Exception:
                W = 2500
            variants = []
            for w in IMG_WIDTHS:
                if w >= W or w == 2500:
                    variants.append((W, write(f"{folder}/{W}.{ext}", big)))
                    break
                variants.append((w, write(f"{folder}/{w}.{ext}", fetch(src + f"?format={w}w"))))
            entry = {"variants": variants, "max": variants[-1][1], "w": W}
        self.cache[k] = entry
        return entry

    def for_width(self, url, want):
        e = self.get(url)
        best = e["variants"][-1][1]
        for w, p in e["variants"]:
            if w >= want:
                return p
        return best

    def srcset(self, url):
        e = self.get(url)
        if e["w"] == 0:
            return None
        return ", ".join(f"{p} {w}w" for w, p in e["variants"])


IMAGES = Images()
IMG_RE = re.compile(r"(?:https?:)?//images\.squarespace-cdn\.com/[^\s\"'<>)\\&]+?(?:\?format=(\d+)w)?(?=[\s\"'<>)\\&]|$)")


def localize_images(text):
    def sub(m):
        want = int(m.group(1)) if m.group(1) else 2500
        return IMAGES.for_width(m.group(0).split("?")[0], want)
    return IMG_RE.sub(sub, text)


# ---------------------------------------------------------------- css / fonts

def localize_css_urls(css, base_url):
    def sub(m):
        raw = m.group(1).strip("'\"")
        if raw.startswith("data:") or raw.startswith("#"):
            return m.group(0)
        absu = urllib.parse.urljoin(base_url, raw)
        if "images.squarespace-cdn.com" in absu:
            return f"url({IMAGES.for_width(absu.split('?')[0], 2500)})"
        return f"url({asset(absu)})"
    return re.sub(r"url\(([^)]+)\)", sub, css)


def asset(url):
    """Copy any other Squarespace-hosted file locally; returns its local path."""
    url = html.unescape(url)
    if url.startswith("//"):
        url = "https:" + url
    p = urllib.parse.urlparse(url)
    base = p.path.rsplit("/", 1)[-1] or "index"
    frag = ("#" + p.fragment) if p.fragment else ""
    if p.netloc == "file.squarespace-cdn.com" and "/fonts/" in p.path:
        rel = f"assets/fonts/{p.path.split('/')[-2][:8]}-{base}"
    elif p.netloc == "assets.squarespace.com":
        rel = "assets/sqs" + p.path
    else:
        rel = f"assets/files/{short(p.netloc + p.path)}-{base}"
    out = DOCS / rel
    if not out.exists():
        write(rel, fetch(urllib.parse.urlunparse(p._replace(fragment=""))))
    return "/" + rel + frag


def stylesheet(url, name):
    css = fetch(url, binary=False)
    css = localize_css_urls(css, url if not url.startswith("//") else "https:" + url)
    return write(f"assets/css/{name}", css)


def css_name(url):
    u = html.unescape(url)
    if "versioned-site-css" in u:
        return "site.css" if "5ef6bcd7ce7ead3262567c60" in u else "padelspot-site.css"
    if "/custom-css/" in u:
        return "custom.css" if "5ef6bcd7ce7ead3262567c60" in u else "padelspot-custom.css"
    if u.endswith("static.css"):
        return "static.css"
    m = re.search(r"static-assets/website\.components\.([A-Za-z]+)/([0-9a-f]{8})", u)
    if m:
        return f"components/{m.group(1)}-{m.group(2)}.css"
    m = re.search(r"styles-compressed/([^/]+?)-min", u)
    if m:
        return f"sqs-{m.group(1)}.css"
    return slug(u) + ".css"


# ---------------------------------------------------------------- videos

def native_video(cfg_json, thumb_url):
    cfg = json.loads(html.unescape(cfg_json))
    base = cfg["alexandriaUrl"].replace("/{variant}", "")
    vid = cfg["systemDataId"][:8]
    mp4 = DOCS / f"assets/video/{vid}.mp4"
    if not mp4.exists():
        # HLS master playlist (signed, short-lived URLs: never cached). Take the largest
        # rendition; some videos carry audio as a separate rendition group.
        req = urllib.request.Request(base + "/playlist.m3u8", headers={"User-Agent": UA})
        master = urllib.request.urlopen(req, timeout=60).read().decode()
        streams = re.findall(r"#EXT-X-STREAM-INF:[^\n]*RESOLUTION=(\d+)x(\d+)[^\n]*\n+(\S+)", master)
        best = max(streams, key=lambda s: int(s[0]) * int(s[1]))[2]
        audio = re.search(r'#EXT-X-MEDIA:TYPE=AUDIO[^\n]*URI="([^"]+)"', master)
        inputs = ["-i", best] + (["-i", audio.group(1)] if audio else [])
        maps = ["-map", "0:v:0", "-map", "1:a:0"] if audio else []
        mp4.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", *inputs, *maps, "-c", "copy",
                        "-bsf:a", "aac_adtstoasc", "-movflags", "+faststart", str(mp4)], check=True)
    poster = IMAGES.for_width(thumb_url, 1500) if thumb_url else write(f"assets/video/{vid}.jpg", fetch(base + "/thumbnail"))
    return f"/assets/video/{vid}.mp4", poster, cfg.get("aspectRatio", 16 / 9)


def embed_iframe(data_html):
    """Squarespace video-block embeds go through embedly; point them straight at the provider."""
    h = html.unescape(data_html)
    src = re.search(r'src="([^"]+)"', h).group(1)
    if "embedly.com" in src:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(src).query)
        target = q["src"][0]
    else:
        target = src if not src.startswith("//") else "https:" + src
    yt = re.search(r"youtube\.com/embed/([\w-]{6,})", target)
    if yt:
        return f"https://www.youtube-nocookie.com/embed/{yt.group(1)}?autoplay=1&rel=0"
    sep = "&" if "?" in target else "?"
    return target + sep + "autoplay=1"


# ---------------------------------------------------------------- page transform

def transform(page_html, page_url, site):
    h = page_html

    # 1. Scripts, preloads and Squarespace-only head tags go.
    h = re.sub(r"<script\b[^>]*>.*?</script>", "", h, flags=re.S | re.I)
    h = re.sub(r"<noscript\b[^>]*>.*?</noscript>", "", h, flags=re.S | re.I)
    h = re.sub(r"<link\b[^>]*rel=\"(?:preconnect|dns-prefetch|preload|modulepreload|alternate)\"[^>]*>\s*", "", h, flags=re.I)
    h = re.sub(r"<meta\b[^>]*http-equiv=\"(?:Accept-CH|X-UA-Compatible)\"[^>]*>\s*", "", h, flags=re.I)
    h = re.sub(r"<base\b[^>]*>\s*", "", h, flags=re.I)
    h = re.sub(r"<link\b[^>]*typekit[^>]*>\s*", "", h, flags=re.I)
    # Squarespace bookkeeping attributes (inert JSON, and they reference its CDN)
    h = re.sub(r"\s(?:data-block-css|data-block-scripts|data-current-context|data-current-styles|data-block-json)=(\"[^\"]*\"|'[^']*')", "", h)

    # 2. Stylesheets -> local copies; append the runtime-only ones and our overrides.
    def css_sub(m):
        tag = m.group(0)
        href = re.search(r'href="([^"]+)"', tag).group(1)
        return tag.replace(href, stylesheet(href, css_name(href)))
    h = re.sub(r"<link\b[^>]*rel=\"stylesheet\"[^>]*>", css_sub, h, flags=re.I)
    extra = "".join(f'<link rel="stylesheet" type="text/css" href="{stylesheet(u, css_name(u))}">' for u in RUNTIME_CSS[site])
    extra += '<link rel="stylesheet" type="text/css" href="/assets/css/port.css">'
    if site == "padel":
        extra += '<link rel="stylesheet" type="text/css" href="/assets/css/padelspot-font.css">'
    extra += '<script defer src="/assets/js/site.js"></script>'
    h = h.replace("</head>", extra + "</head>", 1)

    # 3. Inline <style> blocks: fonts and images inside url().
    h = re.sub(r"(<style\b[^>]*>)(.*?)(</style>)", lambda m: m.group(1) + localize_css_urls(m.group(2), page_url) + m.group(3), h, flags=re.S)

    # 4. Native (Squarespace-hosted) video blocks -> <video>.
    def attr(block, name):
        m = re.search(name + r"""=(?:"([^"]*)"|'([^']*)')""", block)
        return None if not m else (m.group(1) if m.group(1) is not None else m.group(2))

    def native_sub(m):
        block = m.group(0)
        thumb = attr(block, "data-config-thumbnail")
        thumb_url = json.loads(html.unescape(thumb))["assetUrl"] if thumb else None
        src, poster, _ = native_video(attr(block, "data-config-video"), thumb_url)
        player = (f'<video class="native-video-player port-video" controls playsinline preload="none" '
                  f'poster="{poster}" src="{src}"></video>')
        block = re.sub(r"""\sdata-config-(?:video|thumbnail)=(?:"[^"]*"|'[^']*')""", "", block)
        return re.sub(r'<div\s+class="native-video-player"[^>]*>\s*</div>', player, block)
    h = re.sub(r'<div\s+class="sqs-native-video".*?<div\s+class="native-video-player"[^>]*>\s*</div>', native_sub, h, flags=re.S)

    # 5. Embedded video blocks: keep Squarespace's poster overlay, play the provider directly.
    def embed_sub(m):
        return f'data-port-embed="{html.escape(embed_iframe(m.group(1)))}"'
    h = re.sub(r"data-html='([^']*)'", embed_sub, h)
    h = re.sub(r'data-html="([^"]*)"', embed_sub, h)

    # 6. srcset attributes are rebuilt from the local variants; then every other image URL.
    def srcset_sub(m):
        first = re.search(IMG_RE, m.group(1))
        if not first:
            return m.group(0)
        ss = IMAGES.srcset(first.group(0).split("?")[0])
        return f'srcset="{ss}"' if ss else ""
    h = re.sub(r'srcset="([^"]*)"', srcset_sub, h)
    h = localize_images(h)

    # 7. Remaining Squarespace files (fonts, PDFs under /s/, static1 uploads).
    h = re.sub(r"(?:https?:)?//(?:file\.squarespace-cdn\.com|static1\.squarespace\.com|assets\.squarespace\.com)/[^\s\"'<>)\\]+",
               lambda m: asset(m.group(0)), h)
    h = re.sub(r'href="(/s/[^"]+)"', lambda m: f'href="{asset(PADEL + m.group(1))}"', h) if site == "padel" else h

    # Squarespace also serves shared files (the social-icon sprite) from the site's own domain.
    origin = re.match(r"https?://[^/]+", page_url).group(0)
    h = re.sub(r"""(?<=["'(])/universal/([^"'#)\s]+)""",
               lambda m: write("assets/sqs/universal/" + m.group(1), fetch(origin + "/universal/" + m.group(1))), h)

    # 8. Links back into the same site become root-relative.
    h = re.sub(r'href="https?://(?:www\.)?emb\.org/?', 'href="/', h)

    if site == "padel":
        h = padel_fixups(h)

    leftovers = sorted(set(re.findall(r"(?:https?:)?//(?:" + SQS_HOSTS + r")[^\s\"'<>)]*", h)))
    if leftovers:
        print("  ! leftover Squarespace URLs:", len(leftovers), leftovers[:5])
    return h


PADEL_URL = "/portfolio/padelspot/"


def element_end(h, start):
    """Index just past the </div> that closes the <div> opening at `start`."""
    depth = 0
    for m in re.finditer(r"<div\b|</div>", h[start:]):
        depth += 1 if m.group(0) != "</div>" else -1
        if depth == 0:
            return start + m.end()
    raise ValueError("unbalanced div")

# New portfolio tiles, shown first. Images are rendered from tools/tiles/.
NEW_TILES = [
    # title, link, image folder under assets/img, open in a new tab
    ("Regime Trader", "https://regimetrader.ai", "tile-regimetrader", True),
    ("Padel Spot", PADEL_URL.rstrip("/"), "tile-padelspot", False),
]


def portfolio_additions(h):
    tiles = []
    for title, href, folder, new_tab in NEW_TILES:
        srcset = ", ".join(f"/assets/img/{folder}/{w}.jpg {w}w" for w in (500, 1000, 1500, 1920))
        target = ' target="_blank" rel="noopener"' if new_tab else ""
        tiles.append(
            f'<a class="grid-item" href="{href}"{target}> <div class="grid-image"> <div class="grid-image-inner-wrapper"> '
            f'<img src="/assets/img/{folder}/1920.jpg" srcset="{srcset}" sizes="(max-width: 767px) 100vw, 50vw" '
            f'width="1920" height="1080" alt="{title}" data-image-dimensions="1920x1080" data-image-focal-point="0.5,0.5" '
            f'style="display:block;object-position: 50% 50%" decoding="async"> </div> </div> '
            f'<div class="portfolio-overlay"></div> <div class="portfolio-text"> <h3 class="portfolio-title">{title}</h3> </div> </a> ')
    i = re.search(r'<div\s+id="gridThumbs"', h).start()
    j = h.index(">", i) + 1
    return h[:j] + " " + "".join(tiles) + h[j:]


def padel_fixups(h):
    """padelspot.com is being wound down: the invest page lives on at emb.org/portfolio/padelspot."""
    # Header logo pointed at padelspot.com's home page; keep it on this page.
    h = re.sub(r'(<header\b.*?</header>)', lambda m: m.group(1).replace('href="/"', f'href="{PADEL_URL}"'), h, count=1, flags=re.S)
    h = re.sub(r'https?://(?:www\.)?padelspot\.com/invest', "https://www.emb.org" + PADEL_URL.rstrip("/"), h)
    # The contact form posted to Squarespace; the static copy composes an email instead.
    form = (ROOT / "tools" / "padel_form.html").read_text()
    m = re.search(r'<div\s+class="sqs-block website-component-block[^"]*form-block"', h)
    if not m:
        raise SystemExit("padel: form block not found")
    h = h[:m.start()] + form + h[element_end(h, m.start()):]
    # Below the buttons the page previewed the business plan from a Drive file that has since been
    # replaced (the preview reads "file does not exist"). Show the plan itself, page by page.
    pdf = re.search(r'href="(/assets/files/[^"]*Business-Plan[^"]*\.pdf)"', h).group(1)
    h, n = re.subn(r'<iframe\s+src="https://drive\.google\.com/file/d/[^"]+/preview"[^>]*></iframe>', business_plan_viewer(pdf), h)
    if n != 1:
        raise SystemExit("padel: business plan preview not found")
    padel_font()
    return h


def business_plan_viewer(pdf_rel):
    """Scrollable letter-size viewer of a PDF, pre-rendered to images so it works on phones too."""
    import pymupdf
    doc = pymupdf.open(DOCS / pdf_rel.lstrip("/"))
    folder = "assets/img/padel-business-plan"
    pages = []
    for i, page in enumerate(doc, 1):
        files = {}
        for w in (612, 1224):
            rel = f"{folder}/p{i:02d}-{w}.jpg"
            out = DOCS / rel
            zoom = w / page.rect.width
            if not out.exists():
                out.parent.mkdir(parents=True, exist_ok=True)
                page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False).save(str(out), jpg_quality=82)
            files[w] = ("/" + rel, round(page.rect.height * zoom))
        pages.append(f'<img src="{files[1224][0]}" srcset="{files[612][0]} 612w, {files[1224][0]} 1224w" '
                     f'sizes="(max-width: 816px) 100vw, 816px" width="1224" height="{files[1224][1]}" '
                     f'alt="Padel Spot Business Plan, page {i}" loading="lazy" decoding="async">')
    return ('<div class="port-doc" role="document" aria-label="Padel Spot Business Plan" '
            'style="width: 100%; height: calc(100vw * (11 / 8.5)); max-height: 1056px;">' + "".join(pages) + "</div>")


def padel_font():
    """PadelSpot's body font (Adobe proxima-nova) is licensed to Squarespace only.
    Figtree (SIL Open Font License) is the closest free match; it is registered under
    the family name the site's CSS already asks for, so no other CSS has to change."""
    gcss = fetch("https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,700;1,400;1,700&display=swap", binary=False)
    out = ["/* Free stand-in for Adobe proxima-nova (licensed to Squarespace only): Figtree, SIL OFL. */"]
    for block in re.findall(r"@font-face\s*{[^}]*}", gcss):
        rng = re.search(r"unicode-range:\s*([^;]+);", block)
        if rng and "U+0000-00FF" not in rng.group(1) and "U+0100" not in rng.group(1):
            continue  # latin + latin-ext only
        url = re.search(r"url\(([^)]+)\)", block).group(1)
        style = re.search(r"font-style:\s*(\w+)", block).group(1)
        weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
        local = write(f"assets/fonts/figtree-{style}-{weight}-{short(url)}.woff2", fetch(url))
        out.append(block.replace("font-family: 'Figtree'", "font-family: 'proxima-nova'").replace(url, local))
    write("assets/css/padelspot-font.css", "\n".join(out) + "\n")


def fetch_404_page():
    """Squarespace's not-found page (served with HTTP 404, so fetch() can't be used)."""
    path = CACHE / "404.html"
    if not path.exists():
        req = urllib.request.Request(EMB + "/this-page-does-not-exist", headers={"User-Agent": UA})
        try:
            urllib.request.urlopen(req, timeout=60)
            raise SystemExit("expected a 404 page")
        except urllib.error.HTTPError as e:
            path.write_bytes(e.read())
    return path.read_text()


def sitemap():
    urls = ["https://www.emb.org/" + out + ("/" if out else "") for _, out in PAGES]
    body = "".join(f"<url><loc>{u}</loc></url>" for u in urls)
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>\n')


def prefetch(pages):
    """Warm the download cache in parallel: Squarespace resizes images on request, slowly."""
    keys = sorted({IMAGES.key(m.group(0)) for h in pages for m in IMG_RE.finditer(html.unescape(h))})
    keys = [k for k in keys if k.rsplit(".", 1)[-1].lower() not in ("gif", "svg", "ico", "webp")]
    with ThreadPoolExecutor(16) as pool:
        bigs = list(pool.map(lambda k: fetch("https://" + k + "?format=2500w"), keys))
        jobs = []
        for k, big in zip(keys, bigs):
            try:
                W = Image.open(io.BytesIO(big)).size[0]
            except Exception:
                continue
            jobs += [f"https://{k}?format={w}w" for w in IMG_WIDTHS if w < W and w != 2500]
        list(pool.map(fetch, jobs))
    print("prefetched", len(keys), "images")


def main():
    only = sys.argv[1:]
    prefetch([fetch(url, binary=False) for url, out in PAGES if not only or out in only])
    for url, out in PAGES:
        if only and out not in only:
            continue
        site = "padel" if url.startswith(PADEL) else "emb"
        print("port", url, "->", out or "/")
        page = fetch(url, binary=False)
        h = transform(page, url, site)
        if out == "portfolio":
            h = portfolio_additions(h)
        if out in ("", "emb"):
            # Homepage logo slideshow morphs between logos (texture from tools/morph_sdf.py).
            h, n = re.subn(r'<div\s+class="gallery-slideshow"', '<div data-port-morph="/assets/img/home-morph/logos-sdf.png" '
                           'data-port-morph-pad="0.14" class="gallery-slideshow"', h, count=1)
            if n != 1:
                raise SystemExit("home: logo slideshow not found")
        write(f"{out}/index.html" if out else "index.html", h)
    if not only or "404" in only:
        print("port 404 page")
        write("404.html", transform(fetch_404_page(), EMB + "/", "emb"))
    sitemap()
    print("images:", len(IMAGES.cache))


if __name__ == "__main__":
    main()
