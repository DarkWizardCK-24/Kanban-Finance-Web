"""Compose the 1920x1080 promo thumbnails in docs/thumbnails/.

    python tool/make_thumbnails.py

Needs docs/screenshots/*.png (tool/capture_screenshots.py), public/icon-512.png
and docs/fonts/*.ttf. Pages are plain HTML rendered with Playwright Chromium,
with every image and font embedded as a data URI, so the output is reproducible.
Writes kanban-finance-web-thumb-1-hero.png, -2-devices.png, -3-gallery.png.
"""
import base64
import glob
import io
import os

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'docs', 'screenshots')
OUT = os.path.join(ROOT, 'docs', 'thumbnails')
PREFIX = 'kanban-finance-web'

TAGLINE = 'Every rupee, on a board.'
BLURB = ('A responsive web app for your bank accounts: drag transactions through '
         'Pending, Processing, Completed and Failed, and watch net worth update live.')

# Dark "Vault" palette (tailwind.config.ts / src/lib/colors.ts)
BG, SURFACE, CARD, BORDER = '#090E1A', '#111827', '#141E30', '#253450'
TEXT, TEXT2 = '#F0F4FF', '#8B9DC3'
CYAN, GOLD, GREEN, AMBER, RED, BLUE = '#4FC3F7', '#FFD54F', '#4ADE80', '#FBBF24', '#F87171', '#3B82F6'
NAVY = '#0D1B5E'


def data_uri(path, max_w=1000, fmt='JPEG'):
    """Downscale + embed an image (keeps the HTML small)."""
    with Image.open(path) as im:
        im = im.convert('RGB')
        if im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, fmt, quality=95, subsampling=0)
    mime = 'image/jpeg' if fmt == 'JPEG' else 'image/png'
    return f'data:{mime};base64,' + base64.b64encode(buf.getvalue()).decode()


def logo_uri():
    with open(os.path.join(ROOT, 'public', 'icon-512.png'), 'rb') as f:
        return 'data:image/png;base64,' + base64.b64encode(f.read()).decode()


def font_face(family, rel, weight='100 900'):
    with open(os.path.join(ROOT, rel), 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    return (f"@font-face{{font-family:'{family}';font-weight:{weight};"
            f"src:url(data:font/ttf;base64,{b64}) format('truetype');}}")


def shot_path(name):
    return os.path.join(SHOTS, name + '.png')


def shot(name, **kw):
    return data_uri(shot_path(name), **kw)


def aspect(name):
    """height / width of a screenshot, so frames match the real captures."""
    with Image.open(shot_path(name)) as im:
        return im.height / im.width


STATUS = 46  # px of phone status bar (holds the notch) above the page
PHONE_AR = aspect('mobile-dashboard')     # 2532 / 1170 at 390x844 @3x
DESK_AR = aspect('desktop-dashboard')     # 1800 / 2880 at 1440x900 @2x

CSS = f'''
* {{ box-sizing: border-box; margin: 0; }}
html, body {{ width: 1920px; height: 1080px; overflow: hidden; }}
body {{
  font-family: Inter, "Segoe UI", Arial, sans-serif; color: {TEXT}; position: relative;
  background:
    radial-gradient(900px 720px at 76% 34%, rgba(79,195,247,0.17), transparent 62%),
    radial-gradient(760px 620px at 6% 100%, rgba(59,130,246,0.16), transparent 60%),
    radial-gradient(600px 500px at 100% 100%, rgba(255,213,79,0.07), transparent 60%),
    linear-gradient(135deg, #070B15 0%, {BG} 40%, #0B1533 100%);
}}
/* faint kanban-column grid */
body::before {{
  content: ""; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(139,157,195,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139,157,195,0.06) 1px, transparent 1px);
  background-size: 120px 80px;
  -webkit-mask-image: linear-gradient(120deg, transparent 8%, #000 55%, #000 100%);
  mask-image: linear-gradient(120deg, transparent 8%, #000 55%, #000 100%);
}}
.abs {{ position: absolute; }}
.glow {{ position: absolute; border-radius: 50%; filter: blur(30px); pointer-events: none; }}
.vig {{ position: absolute; inset: 0; background: radial-gradient(1400px 900px at 60% 50%, transparent 55%, rgba(0,0,0,.35) 100%); pointer-events: none; z-index: 8; }}
.spark {{ position: absolute; width: 56px; height: 56px; z-index: 6; }}
.logo {{ border-radius: 22%; box-shadow: 0 18px 50px rgba(0,0,0,.55), 0 0 70px rgba(79,195,247,.25); }}
h1 {{ font-weight: 800; letter-spacing: -4px; line-height: 1; white-space: nowrap; }}
h1 b {{ font-weight: 800; background: linear-gradient(135deg, #9BE0FF, {CYAN} 50%, {BLUE});
  -webkit-background-clip: text; background-clip: text; color: transparent; }}
.tag {{ color: {GOLD}; font-weight: 700; letter-spacing: -.5px; white-space: nowrap; }}
.blurb {{ color: rgba(240,244,255,.72); line-height: 1.42; }}
.pills {{ display: flex; flex-wrap: wrap; gap: 14px; width: 760px; }}
.pill {{
  display: inline-flex; align-items: center; gap: 12px; padding: 10px 22px;
  border-radius: 999px; border: 2px solid {BORDER};
  background: rgba(20,30,48,.75); font-size: 26px; font-weight: 600;
}}
.pill i {{ width: 12px; height: 12px; border-radius: 50%; display: block; }}
.chip {{ display: inline-flex; align-items: center; gap: 12px; padding: 12px 26px;
  border-radius: 999px; background: linear-gradient(135deg, #9BE0FF, {CYAN} 55%, #2A9FD6); color: {BG};
  font-weight: 800; font-size: 26px; white-space: nowrap; }}
.chip i {{ width: 12px; height: 12px; border-radius: 50%; background: {BG}; display: block; }}
.plat {{ white-space: nowrap; font-size: 25px; font-weight: 600; color: {TEXT2}; letter-spacing: .3px; }}
.phone {{
  position: absolute; background: #05070C; border-radius: 64px; padding: 13px;
  box-shadow: 0 0 0 3px #2C3A55, 0 40px 90px rgba(0,0,0,.7), 0 0 0 1px #000 inset;
}}
.phone .scr {{ position: relative; border-radius: 52px; overflow: hidden; background: {SURFACE}; width: 100%; height: 100%; padding-top: {STATUS}px; }}
.phone img {{ width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }}
.phone .notch {{ position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  width: 30%; height: 28px; background: #000; border-radius: 99px; z-index: 2; }}
.laptop-screen {{
  position: absolute; background: #05070C; border-radius: 24px; padding: 14px 14px 16px;
  box-shadow: 0 0 0 3px #2C3A55, 0 40px 90px rgba(0,0,0,.6);
}}
.laptop-screen img {{ width: 100%; height: 100%; object-fit: cover; object-position: top left; display: block; border-radius: 8px; }}
.laptop-base {{ position: absolute; height: 24px; border-radius: 4px 4px 28px 28px;
  background: linear-gradient(#3B4763, #1A2236); box-shadow: 0 30px 50px rgba(0,0,0,.55); }}
.laptop-base::after {{ content: ""; position: absolute; left: 50%; top: 0; transform: translateX(-50%);
  width: 160px; height: 9px; border-radius: 0 0 10px 10px; background: #111827; }}
.card {{
  position: absolute; display: flex; align-items: center; gap: 22px; padding: 22px 34px 22px 22px;
  border-radius: 28px; background: rgba(17,24,39,.94); border: 2px solid {BORDER};
  box-shadow: 0 24px 60px rgba(0,0,0,.55); z-index: 5; white-space: nowrap;
}}
.card .ic {{ width: 78px; height: 78px; border-radius: 20px; display: grid; place-items: center; }}
.card small {{ display: block; font-size: 26px; color: {TEXT2}; letter-spacing: .3px; }}
.card strong {{ display: block; font-size: 42px; font-weight: 800; letter-spacing: -.8px; }}
'''

SPARK = ('<svg class="spark" style="{s}" viewBox="0 0 100 100"><path d="M50 2 C54 38 62 46 98 50 '
         'C62 54 54 62 50 98 C46 62 38 54 2 50 C38 46 46 38 50 2 Z" fill="{c}" opacity=".9"/></svg>')


def spark(style, color=CYAN):
    return SPARK.format(s=style, c=color)


def icon(path, stroke=BG, size=46):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{stroke}" '
            f'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">{path}</svg>')


ICON_BOARD = icon('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>')
ICON_TREND = icon('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>')
ICON_SYNC = icon('<path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"/><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>')
ICON_MOVE = icon('<path d="M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20"/><rect x="8" y="7" width="8" height="10" rx="2"/>')

CYAN_BG = f'linear-gradient(135deg,#9BE0FF,{CYAN} 55%,#2A9FD6)'
GREEN_BG = f'linear-gradient(135deg,#A7F3C0,{GREEN} 60%,#22A45A)'
GOLD_BG = f'linear-gradient(135deg,#FFE58A,{GOLD} 55%,#E0A800)'


def card(style, ic, bg, small, strong):
    return (f'<div class="card" style="{style}"><div class="ic" style="background:{bg}">{ic}</div>'
            f'<div><small>{small}</small><strong>{strong}</strong></div></div>')


def phone(img, left, top, w, rot=0, z=1):
    """Phone whose screen keeps the mobile screenshot's real aspect ratio."""
    pad = 13
    inner_w = w - 2 * pad
    h = round(inner_w * PHONE_AR) + 2 * pad + STATUS  # status-bar strip above the web page
    return (f'<div class="phone" style="left:{left}px;top:{top}px;width:{w}px;height:{h}px;'
            f'transform:rotate({rot}deg);z-index:{z}"><div class="scr"><div class="notch"></div>'
            f'<img src="{img}"></div></div>')


def laptop(img, left, top, w):
    """Laptop whose screen keeps the desktop screenshot's real aspect ratio."""
    inner_w = w - 28
    h = round(inner_w * DESK_AR) + 30
    return (f'<div class="laptop-screen" style="left:{left}px;top:{top}px;width:{w}px;height:{h}px;z-index:2">'
            f'<img src="{img}"></div>'
            f'<div class="laptop-base" style="left:{left - 50}px;top:{top + h}px;width:{w + 100}px;z-index:2"></div>')


PILLS = [('Status kanban boards', AMBER), ('Cross-account drag', BLUE),
         ('Wealth dashboard', GREEN), ('Bank-brand cards', CYAN)]


def left_block(t):
    pills = ''.join(f'<span class="pill"><i style="background:{c}"></i>{txt}</span>' for txt, c in PILLS)
    return f'''
  <img class="logo abs" src="{logo_uri()}" style="left:110px;top:{t}px;width:170px;height:170px">
  <h1 class="abs" style="left:104px;top:{t + 215}px;font-size:112px">Kanban <b>Finance</b></h1>
  <div class="tag abs" style="left:110px;top:{t + 370}px;font-size:46px">{TAGLINE}</div>
  <div class="blurb abs" style="left:110px;top:{t + 448}px;width:800px;font-size:30px">{BLURB}</div>
  <div class="pills abs" style="left:110px;top:{t + 625}px">{pills}</div>
  <div class="abs" style="left:110px;top:{t + 795}px;display:flex;align-items:center;gap:24px">
    <span class="chip"><i></i>Built with Next.js</span>
    <span class="plat">Firebase &nbsp;·&nbsp; Desktop &nbsp;·&nbsp; Tablet &nbsp;·&nbsp; Mobile web</span>
  </div>'''


def hero():
    return (
        '<div class="glow" style="left:1060px;top:120px;width:800px;height:800px;'
        'background:radial-gradient(circle,rgba(79,195,247,.26),transparent 65%)"></div>'
        + left_block(50)
        + spark('left:905px;top:235px;width:44px;height:44px')
        + spark('left:1850px;top:120px;width:40px;height:40px', GOLD)
        + spark('left:1830px;top:960px;width:48px;height:48px')
        + phone(shot('mobile-accounts'), 1010, 300, 350, rot=-8, z=1)
        + phone(shot('mobile-kanban'), 1520, 290, 350, rot=8, z=1)
        + phone(shot('mobile-dashboard'), 1250, 150, 420, rot=0, z=3)
        + card('left:960px;top:28px', ICON_BOARD, CYAN_BG, 'Drag between columns', 'Pending to done')
        + card('left:900px;top:900px', ICON_TREND, GREEN_BG, 'Net worth', 'Live from Firestore')
        + '<div class="vig"></div>'
    )


def devices():
    return (
        '<div class="glow" style="left:1040px;top:160px;width:820px;height:760px;'
        'background:radial-gradient(circle,rgba(79,195,247,.22),transparent 65%)"></div>'
        + left_block(50)
        + spark('left:900px;top:140px;width:44px;height:44px')
        + spark('left:1840px;top:60px;width:48px;height:48px', GOLD)
        + laptop(shot('desktop-kanban', max_w=1600), 960, 215, 850)
        + phone(shot('mobile-account-board'), 1595, 350, 295, z=4)
        + card('left:1010px;top:60px', ICON_MOVE, CYAN_BG, 'Cross-account board', 'Drag to reassign')
        + card('left:1000px;top:880px', ICON_SYNC, GOLD_BG, 'Shared Firebase', 'Synced with mobile')
        + '<div class="vig"></div>'
    )


def gallery():
    specs = [
        ('mobile-login', 95, 520, 320),
        ('mobile-accounts', 445, 465, 330),
        ('mobile-dashboard', 790, 335, 340),
        ('mobile-account-board', 1145, 465, 330),
        ('mobile-kanban', 1505, 520, 320),
    ]
    phones = ''.join(phone(shot(n), x, y, w, z=3 if i == 2 else 1) for i, (n, x, y, w) in enumerate(specs))
    return f'''
  <div class="glow" style="left:560px;top:260px;width:800px;height:700px;background:radial-gradient(circle,rgba(79,195,247,.22),transparent 65%)"></div>
  <div class="abs" style="left:0;top:58px;width:1920px;display:flex;justify-content:center;align-items:center;gap:34px">
    <img class="logo" src="{logo_uri()}" style="width:132px;height:132px">
    <h1 style="font-size:120px">Kanban <b>Finance</b></h1>
  </div>
  <div class="tag abs" style="left:0;top:222px;width:1920px;text-align:center;font-size:52px">{TAGLINE}</div>
  {spark('left:150px;top:110px;')}
  {spark('left:1730px;top:215px;width:44px;height:44px', GOLD)}
  {phones}
  <div class="vig"></div>'''


PAGES = {
    f'{PREFIX}-thumb-1-hero.png': hero,
    f'{PREFIX}-thumb-2-devices.png': devices,
    f'{PREFIX}-thumb-3-gallery.png': gallery,
}


def main():
    os.makedirs(OUT, exist_ok=True)
    css = font_face('Inter', 'docs/fonts/Inter.ttf') + CSS
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception:
            exe = sorted(glob.glob(os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ms-playwright',
                                                'chromium-*', 'chrome-win*', 'chrome.exe')))[-1]
            browser = p.chromium.launch(executable_path=exe)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        for name, build in PAGES.items():
            page.set_content(f'<html><head><meta charset="utf-8"><style>{css}</style></head>'
                             f'<body>{build()}</body></html>')
            page.wait_for_timeout(700)
            path = os.path.join(OUT, name)
            page.screenshot(path=path)
            with Image.open(path) as im:
                assert im.size == (1920, 1080), im.size
            print('saved', path)
        browser.close()


if __name__ == '__main__':
    main()
