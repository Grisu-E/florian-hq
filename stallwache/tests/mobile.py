import asyncio, pathlib, json
from playwright.async_api import async_playwright
APP = pathlib.Path('/home/claude/stallwache/app'); MOCK = pathlib.Path('/home/claude/test/mock.js').read_text()
OUT = pathlib.Path('/home/claude/test/mob'); OUT.mkdir(exist_ok=True)
PAGES = ['?nologin', '', 'klappe', 'kamera', 'eier', 'pflege', 'herde', 'stallpflicht', 'traenke', 'ziegen', 'mitglieder', 'profil']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for w in (360, 390):
            pg = await b.new_page(viewport={'width': w, 'height': 800}, device_scale_factor=1, is_mobile=True, has_touch=True)
            async def route(r):
                u = r.request.url
                if 'supabase-js' in u: return await r.fulfill(body=MOCK, content_type='application/javascript')
                if u.startswith('http://app.test/'):
                    f = APP / (u.split('http://app.test/')[1].split('#')[0].split('?')[0] or 'index.html')
                    if f.exists():
                        ct = {'html': 'text/html', 'js': 'application/javascript', 'svg': 'image/svg+xml', 'png': 'image/png', 'webmanifest': 'application/json'}[f.suffix[1:]]
                        return await r.fulfill(body=f.read_bytes(), content_type=ct)
                await r.abort()
            await pg.route('**/*', route)
            for h in PAGES:
                await pg.goto('http://app.test/index.html' + (h if h.startswith('?') else '#' + h)); await pg.wait_for_timeout(600)
                res = await pg.evaluate('''() => { const W = document.documentElement.clientWidth; const out = [];
                  document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed') out.push((e.className||e.tagName)+':'+Math.round(r.left)+'-'+Math.round(r.right)); });
                  return { sw: document.documentElement.scrollWidth, W, out: out.slice(0, 8) }; }''')
                name = (h or 'home').strip('?')
                print(w, name, 'scrollWidth', res['sw'], 'viewport', res['W'], res['out'])
                await pg.screenshot(path=str(OUT / f'{w}_{name}.png'), full_page=True)
            await pg.close()
        await b.close()
asyncio.run(main())
