Bootleg OS portfolio prototype. Open index.html locally. Edit js/app.js stations array to add Internet Archive audio links. Replace mailto address in contact.html. Gallery content is generated from js/gallery-data.js. Weather uses Open-Meteo and needs internet access in browser.

BEFORE PUBLISHING, find-and-replace across all .html files:
- YOUR-EMAIL-HERE (contact.html form action)
- your-domain-here.example (Open Graph/Twitter meta tags, once the site has a real URL)

Each page now has a meta description + Open Graph/Twitter tags (see inject_meta.py, which can be re-run if page titles/descriptions change) and a favicon pointing at assets/brand/bootleg-logo.png.


Next-pass structure:
- blog-pages/ contains reusable blog posts and TEMPLATE.html
- project-pages/ contains individual case studies
- assets/docs/ contains downloadable CV
- js/blog-data.js controls newest-first blog index and categories


BOOTLEG OS 0.4 PASS
-------------------
- Assets folder was intentionally omitted from this transfer. Existing asset paths are preserved.
- Added Projects/Gallery intro spacing.
- Fixed SVG clock-hand centres without changing clock layout/design.
- Removed obsolete root project/blog redirect duplicates after link migration.
- Registered Photography and Sketches gallery folders; individual filenames still need a manifest because assets were not included.
- Added project pages for Future Designs, Porcelain Man, Raspberry Pi, Real Angel Model and Toons App based on the current project-media folder structure.
- Kept existing Pirate Radio/Weather styling and added a more reliable mini-radio dial rotation binding.


BOOTLEG OS 0.5 - GALLERY / PROJECT MEDIA UPDATES
------------------------------------------------
The website now indexes Gallery and project media from JavaScript manifests.
After restoring your normal assets folder, future updates are:

1. Drop new files into assets\gallery\<Category> or assets\project-media\<Project>.
2. Double-click tools\refresh-content.bat.
3. Refresh the website.

The refresh tool automatically rebuilds js\gallery-data.js and js\project-media-data.js.
PNG/JPG/JPEG/WEBP/GIF and MP4/WEBM preview in-browser. PDF and formats such as HEIC, MOV, PPTX and ODP are preserved as open/download entries rather than broken image placeholders.

Clock hands in 0.5 no longer use CSS/SVG rotation transforms; their endpoints are recalculated from the fixed centre pin every second.
