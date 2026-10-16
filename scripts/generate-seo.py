"""Keep canonical URLs and the Pages project sitemap aligned with public HTML."""
from pathlib import Path
from html import escape
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://bootlegproductions.github.io/Bootleg-OS/'

paths = sorted(
    (p for p in ROOT.rglob('*.html')
     if '.git' not in p.parts and p.relative_to(ROOT).as_posix() != 'blog-pages/TEMPLATE.html'),
    key=lambda p: (p.relative_to(ROOT).as_posix() != 'index.html', p.relative_to(ROOT).as_posix())
)
urls = []
for path in paths:
    relative = path.relative_to(ROOT).as_posix()
    url = BASE if relative == 'index.html' else BASE + relative
    urls.append(url)
    source = path.read_text(encoding='utf-8')
    if not re.search(r'<link\s+rel=["\']canonical["\']', source, flags=re.I):
        source = re.sub(r'(<title>.*?</title>)', r'\1\n    <link rel="canonical" href="' + escape(url, quote=True) + '">', source, count=1, flags=re.I | re.S)
    if relative == 'index.html':
        source = source.replace('content="' + BASE + 'index.html"', 'content="' + BASE + '"')
    path.write_text(source, encoding='utf-8')

sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sitemap += ''.join('  <url><loc>' + escape(url) + '</loc></url>\n' for url in urls)
sitemap += '</urlset>\n'
(ROOT / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
print(f'Updated {len(urls)} public pages and sitemap.xml')
