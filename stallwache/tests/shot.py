import asyncio, sys, pathlib
from playwright.async_api import async_playwright

APP = pathlib.Path('/home/claude/stallwache/app')
MOCK = pathlib.Path('/home/claude/test/mock.js').read_text()
OUT = pathlib.Path('/home/claude/test/shots'); OUT.mkdir(exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 400, 'height': 860}, device_scale_factor=1)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
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
        for h in ['?nologin'] + ['', 'klappe', 'kamera', 'eier', 'pflege', 'herde', 'gesundheit', 'ziegen', 'mitglieder', 'profil']:
            await pg.goto('http://app.test/index.html' + (h if h.startswith('?') else '#' + h))
            await pg.wait_for_timeout(700)
            await pg.screenshot(path=str(OUT / f'{(h or "home").strip("?")}.png'), full_page=True)
        print('ERRORS:', errs)
        await b.close()
asyncio.run(main())
