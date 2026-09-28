#!/usr/bin/env python3
"""Build the category + project pages.

  python tools/build_pages.py --images   # raw photos -> assets/projects/<slug>/NN.webp (+ cover.webp)
  python tools/build_pages.py            # data/projects.json -> offices.html, residential.html, p/<slug>.html

Raw photos are read from --src (default: site/assets, or ../_originals once they were moved there).
Edit names / order / which shots are used in data/projects.json (optional "drop": [1-based numbers]).
"""
import argparse, json, os, re, sys
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
SITE = Path(__file__).resolve().parent.parent
DATA = json.loads((SITE / "data" / "projects.json").read_text(encoding="utf-8"))
OUT_IMG = SITE / "assets" / "projects"
LONG_EDGE, QUALITY = 2400, 80


def default_src():
    orig = SITE.parent / "_originals"
    return orig if orig.exists() else SITE / "assets"


def pick_files(folder: Path, mode: str):
    exts = (".jpg", ".jpeg", ".png")
    files = sorted(p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in exts)
    if mode == "ERZ":
        files = [p for p in files if p.name.startswith("ERZ_") and not p.stem.endswith("-2")]
    elif mode == "big-only":
        keep = []
        for p in files:
            try:
                w, h = Image.open(p).size
            except Exception:
                continue
            if max(w, h) >= 3000 and not re.search(r"\(1\)", p.name):
                keep.append(p)
        files = keep
    return files


def export(im: Image.Image, dest: Path, long_edge=LONG_EDGE):
    im = im.convert("RGB")
    w, h = im.size
    s = min(1.0, long_edge / max(w, h))
    if s < 1:
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=QUALITY, method=6)


def build_images(src_root: Path):
    for slug, p in DATA["projects"].items():
        folder = src_root / p["src"]
        if not folder.exists():
            print("missing source folder", folder); continue
        files = pick_files(folder, p["pick"])
        out = OUT_IMG / slug
        for old in out.glob("*.webp"):
            old.unlink()
        for i, f in enumerate(files, 1):
            export(Image.open(f), out / f"{i:02d}.webp")
        print(f"{slug}: {len(files)} images")


def shots(slug):
    d = OUT_IMG / slug
    drop = set(DATA["projects"][slug].get("drop", []))
    res = []
    for f in sorted(d.glob("[0-9][0-9].webp")):
        n = int(f.stem)
        if n in drop:
            continue
        w, h = Image.open(f).size
        res.append((f.name, w, h))
    return res


def cover(slug):
    """cover file name: the configured one, else the first landscape shot"""
    p = DATA["projects"][slug]
    if p.get("cover"):
        return f"{int(p['cover']):02d}.webp"
    for name, w, h in shots(slug):
        if w >= h:
            return name
    return shots(slug)[0][0]


def head(title, depth, desc):
    root = "../" * depth
    return f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:type" content="website">
<link rel="icon" href="{root}assets/icons/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="{root}assets/icons/favicon-32.png">
<link rel="apple-touch-icon" href="{root}assets/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap">
<link rel="stylesheet" href="{root}styles.css?v=20260964">
</head>
<body class="subpage">
<header class="header" id="header">
  <div class="header__inner glass">
    <nav class="nav" id="nav" aria-label="ניווט ראשי">
      <a href="{root}index.html">בית</a>
      <a href="{root}index.html#projects" class="active">פרויקטים</a>
      <a href="{root}index.html#about">אודות</a>
      <a href="{root}index.html#contact" class="nav__cta">צור קשר</a>
    </nav>
  </div>
</header>
<main>
"""


def foot(depth):
    root = "../" * depth
    return f"""</main>
<footer class="subfoot">
  <span>© <span class="js-year"></span> טלי יפת</span>
</footer>
<a class="wa-fab" data-wa href="#" aria-label="שליחת הודעה בוואטסאפ" target="_blank" rel="noopener">
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/></svg>
</a>
<script src="{root}app.js?v=20260964" defer></script>
</body>
</html>
"""


ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'


def category_page(cat):
    depth = 0
    out = head(f"{cat['he']} · טלי יפת", depth, f"{cat['he']} — פרויקטים נבחרים של טלי יפת")
    out += f'<section class="cat">\n  <h1 class="cat__title">{cat["he"]}</h1>\n  <div class="cat__list">\n'
    for slug in cat["projects"]:
        p = DATA["projects"][slug]
        out += f"""    <a class="cat-card reveal" href="p/{slug}.html">
      <img src="assets/projects/{slug}/{cover(slug)}" alt="{p['name']}" loading="lazy" decoding="async">
      <span class="cat-card__label glass"><span class="cat-card__name">{p['name']}</span><span class="cat-card__go">Explore {ARROW}</span></span>
    </a>
"""
    out += "  </div>\n</section>\n"
    return out + foot(depth)


def project_page(slug):
    p = DATA["projects"][slug]
    cat = next(c for c in DATA["categories"] if c["slug"] == p["category"])
    order = cat["projects"]
    nxt = DATA["projects"][order[(order.index(slug) + 1) % len(order)]]
    nxt_slug = order[(order.index(slug) + 1) % len(order)]
    out = head(f"{p['name']} · טלי יפת", 1, f"{p['name']} — {cat['he']}")
    out += f'<section class="pj-head">\n  <a class="pj-back" href="../{cat["slug"]}.html">{ARROW}<span>{cat["he"]}</span></a>\n  <h1 class="pj-title">{p["name"]}</h1>\n</section>\n<section class="pj-shots">\n'
    for i, (name, w, h) in enumerate(shots(slug)):
        cls = "pj-shot pj-shot--tall" if h > w else "pj-shot"
        load = 'fetchpriority="high"' if i == 0 else 'loading="lazy"'
        out += f'  <figure class="{cls}"><img src="../assets/projects/{slug}/{name}" width="{w}" height="{h}" style="--r:{w/h:.4f}" alt="{p["name"]}" {load} decoding="async"></figure>\n'
    out += "</section>\n"
    out += f"""<a class="pj-next" href="{nxt_slug}.html">
  <img src="../assets/projects/{nxt_slug}/{cover(nxt_slug)}" alt="" loading="lazy" decoding="async">
  <span class="pj-next__label glass"><span class="pj-next__name">{nxt['name']}</span><span class="cat-card__go">Explore {ARROW}</span></span>
</a>
"""
    return out + foot(1)


def build_pages():
    (SITE / "p").mkdir(exist_ok=True)
    for cat in DATA["categories"]:
        (SITE / f"{cat['slug']}.html").write_text(category_page(cat), encoding="utf-8")
    for slug in DATA["projects"]:
        (SITE / "p" / f"{slug}.html").write_text(project_page(slug), encoding="utf-8")
    print("pages written:", len(DATA["categories"]) + len(DATA["projects"]))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", action="store_true")
    ap.add_argument("--src")
    a = ap.parse_args()
    if a.images:
        build_images(Path(a.src) if a.src else default_src())
    else:
        build_pages()
